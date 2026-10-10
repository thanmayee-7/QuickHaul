const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

const addReview = async (req, res) => {
  try {
    const { booking_id, rating, punctuality_rating = 5, handling_rating = 5, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'booking_id and rating are required.' });
    }

    const booking = await getAsync('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (!booking.driver_id) {
      return res.status(400).json({ error: 'Cannot review a booking without an assigned driver.' });
    }

    const existing = await getAsync('SELECT id FROM reviews WHERE booking_id = ?', [booking_id]);
    if (existing) {
      return res.status(400).json({ error: 'A review has already been submitted for this booking.' });
    }

    const reviewId = 'rev_' + uuidv4().substring(0, 10);
    await runAsync(`
      INSERT INTO reviews (id, booking_id, customer_id, driver_id, rating, punctuality_rating, handling_rating, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [reviewId, booking_id, req.user.id, booking.driver_id, rating, punctuality_rating, handling_rating, comment || '']);

    // Recalculate driver average rating
    const driverReviews = await allAsync('SELECT rating FROM reviews WHERE driver_id = ?', [booking.driver_id]);
    const totalCount = driverReviews.length;
    const avgRating = +(driverReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(2);

    await runAsync(`
      UPDATE drivers
      SET rating_avg = ?,
          rating_count = ?
      WHERE id = ?
    `, [avgRating, totalCount, booking.driver_id]);

    const created = await getAsync('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    return res.status(201).json({ message: 'Thank you for your rating!', review: created, new_driver_rating: avgRating });
  } catch (error) {
    console.error('addReview error:', error);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
};

const getDriverReviews = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const reviews = await allAsync(`
      SELECT r.*, u.name as customer_name, u.avatar_url as customer_avatar
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.driver_id = ?
      ORDER BY r.created_at DESC
    `, [driverId]);

    return res.json({ reviews });
  } catch (error) {
    console.error('getDriverReviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

module.exports = {
  addReview,
  getDriverReviews
};
