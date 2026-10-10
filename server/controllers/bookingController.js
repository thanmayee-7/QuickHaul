const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

// Calculate Haversine distance in KM between 2 lat/lng points
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
};

const createBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      vehicle_category_id,
      pickup_address,
      pickup_lat = 12.9352,
      pickup_lng = 77.6245,
      pickup_contact_name,
      pickup_contact_phone,
      drop_address,
      drop_lat = 12.9815,
      drop_lng = 77.7289,
      drop_contact_name,
      drop_contact_phone,
      distance_km: inputDistance,
      goods_type,
      goods_description,
      approx_weight_kg = 100,
      helper_needed = 0,
      fragile_handling = 0,
      payment_method = 'cash_on_delivery',
      promo_code
    } = req.body;

    if (!vehicle_category_id || !pickup_address || !drop_address || !goods_type) {
      return res.status(400).json({ error: 'Pickup address, drop address, vehicle category, and goods type are required.' });
    }

    const category = await getAsync('SELECT * FROM vehicle_categories WHERE id = ?', [vehicle_category_id]);
    if (!category) {
      return res.status(404).json({ error: 'Selected vehicle category not found.' });
    }

    // Calculate distance
    let distanceKm = parseFloat(inputDistance);
    if (!distanceKm || isNaN(distanceKm)) {
      distanceKm = calculateDistanceKm(pickup_lat, pickup_lng, drop_lat, drop_lng);
    }
    if (distanceKm < 0.8) distanceKm = 3.5; // realistic minimum city commute

    // Fare calculation
    const baseFare = category.base_fare;
    const baseKm = category.base_km_included;
    const extraKm = Math.max(0, distanceKm - baseKm);
    const distanceFare = +(extraKm * category.per_km_rate).toFixed(2);
    const helperFare = helper_needed ? category.helper_rate : 0.0;
    const fragileFare = fragile_handling ? 50.0 : 0.0;
    const subtotal = +(baseFare + distanceFare + helperFare + fragileFare).toFixed(2);

    let discount = 0.0;
    if (promo_code) {
      const code = promo_code.toUpperCase().trim();
      if (code === 'QUICK50') discount = Math.min(50, +(subtotal * 0.15).toFixed(2));
      else if (code === 'FIRSTHAUL') discount = Math.min(100, +(subtotal * 0.20).toFixed(2));
    }

    const taxable = Math.max(0, subtotal - discount);
    const gstTax = +(taxable * 0.05).toFixed(2);
    const totalFare = +(taxable + gstTax).toFixed(2);

    const commissionPercent = category.commission_percent || 15.0;
    const platformCommission = +(totalFare * (commissionPercent / 100)).toFixed(2);
    const driverEarnings = +(totalFare - platformCommission).toFixed(2);
    const durationMins = Math.round(15 + (distanceKm / 20) * 60);

    // Generate unique booking number and 4-digit OTPs
    const bookingNumber = 'QH-' + Math.floor(1000 + Math.random() * 9000);
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const bookingId = 'bk_' + uuidv4().substring(0, 10);

    // Smart Driver Matching: find an online, verified driver for this category
    const availableDriver = await getAsync(`
      SELECT d.id, d.user_id, u.name as driver_name
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.vehicle_category_id = ?
        AND d.is_online = 1
        AND d.is_verified = 1
        AND d.verification_status = 'approved'
      ORDER BY d.rating_avg DESC
      LIMIT 1
    `, [vehicle_category_id]);

    const assignedDriverId = availableDriver ? availableDriver.id : null;
    const initialStatus = assignedDriverId ? 'accepted' : 'requested';

    await runAsync(`
      INSERT INTO bookings (
        id, booking_number, customer_id, driver_id, vehicle_category_id,
        pickup_address, pickup_lat, pickup_lng, pickup_contact_name, pickup_contact_phone,
        drop_address, drop_lat, drop_lng, drop_contact_name, drop_contact_phone,
        distance_km, estimated_duration_mins, goods_type, goods_description, approx_weight_kg,
        helper_needed, fragile_handling, base_fare, distance_fare, helper_fare, gst_tax,
        discount_amount, total_fare, driver_earnings, platform_commission,
        payment_method, payment_status, status, pickup_otp, delivery_otp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [
      bookingId, bookingNumber, customerId, assignedDriverId, vehicle_category_id,
      pickup_address, pickup_lat, pickup_lng, pickup_contact_name || req.user.name, pickup_contact_phone || req.user.phone,
      drop_address, drop_lat, drop_lng, drop_contact_name || '', drop_contact_phone || '',
      distanceKm, durationMins, goods_type, goods_description || '', approx_weight_kg,
      helper_needed ? 1 : 0, fragile_handling ? 1 : 0, baseFare, distanceFare, helperFare, gstTax,
      discount, totalFare, driverEarnings, platformCommission,
      payment_method, initialStatus, pickupOtp, deliveryOtp
    ]);

    // Send notifications
    await runAsync(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, 'Booking Confirmed #${bookingNumber}', ?, 'booking_update', ?)
    `, [
      'notif_' + uuidv4().substring(0, 8),
      customerId,
      assignedDriverId
        ? `Driver ${availableDriver.driver_name} has accepted your trip. Pickup OTP: ${pickupOtp}`
        : `Searching for nearby ${category.name} drivers. We will notify you once accepted.`,
      `/customer?tab=track&booking=${bookingId}`
    ]);

    if (availableDriver) {
      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'New Trip Assigned #${bookingNumber}', ?, 'booking_update', ?)
      `, [
        'notif_' + uuidv4().substring(0, 8),
        availableDriver.user_id,
        `New trip from ${pickup_address.substring(0, 30)}... Net earnings: ₹${driverEarnings}`,
        `/driver?tab=active`
      ]);
    }

    const createdBooking = await getBookingFull(bookingId);
    return res.status(201).json({
      message: 'Booking created successfully.',
      booking: createdBooking
    });
  } catch (error) {
    console.error('createBooking error:', error);
    return res.status(500).json({ error: 'Failed to create booking.', details: error.message });
  }
};

const getBookingFull = async (id) => {
  return await getAsync(`
    SELECT
      b.*,
      vc.name as category_name,
      vc.tagline as category_tagline,
      vc.max_payload_kg,
      vc.dimensions_feet,
      vc.image_icon,
      cu.name as customer_name,
      cu.email as customer_email,
      cu.phone as customer_phone,
      cu.avatar_url as customer_avatar,
      du.name as driver_name,
      du.email as driver_email,
      du.phone as driver_phone,
      du.avatar_url as driver_avatar,
      d.license_number as driver_license,
      d.vehicle_model,
      d.vehicle_plate,
      d.rating_avg as driver_rating,
      d.total_trips as driver_trips_count,
      d.current_lat as driver_current_lat,
      d.current_lng as driver_current_lng,
      r.rating as customer_review_rating,
      r.comment as customer_review_comment
    FROM bookings b
    LEFT JOIN vehicle_categories vc ON b.vehicle_category_id = vc.id
    LEFT JOIN users cu ON b.customer_id = cu.id
    LEFT JOIN drivers d ON b.driver_id = d.id
    LEFT JOIN users du ON d.user_id = du.id
    LEFT JOIN reviews r ON b.id = r.booking_id
    WHERE b.id = ? OR b.booking_number = ?
  `, [id, id]);
};

const getBookingById = async (req, res) => {
  try {
    const booking = await getBookingFull(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json({ booking });
  } catch (error) {
    console.error('getBookingById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve booking.' });
  }
};

const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;

    let sql = `
      SELECT
        b.*,
        vc.name as category_name,
        vc.image_icon,
        du.name as driver_name,
        du.phone as driver_phone,
        d.vehicle_model,
        d.vehicle_plate,
        d.rating_avg as driver_rating,
        r.rating as review_rating
      FROM bookings b
      LEFT JOIN vehicle_categories vc ON b.vehicle_category_id = vc.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.customer_id = ?
    `;
    const params = [customerId];

    if (status && status !== 'all') {
      if (status === 'active') {
        sql += ` AND b.status IN ('requested', 'accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop')`;
      } else {
        sql += ` AND b.status = ?`;
        params.push(status);
      }
    }

    sql += ` ORDER BY b.created_at DESC`;
    const bookings = await allAsync(sql, params);
    return res.json({ bookings });
  } catch (error) {
    console.error('getCustomerBookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer bookings.' });
  }
};

const getDriverBookings = async (req, res) => {
  try {
    const driver = await getAsync('SELECT * FROM drivers WHERE user_id = ?', [req.user.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const { status } = req.query;

    let sql = `
      SELECT
        b.*,
        vc.name as category_name,
        vc.image_icon,
        cu.name as customer_name,
        cu.phone as customer_phone,
        cu.avatar_url as customer_avatar
      FROM bookings b
      LEFT JOIN vehicle_categories vc ON b.vehicle_category_id = vc.id
      LEFT JOIN users cu ON b.customer_id = cu.id
      WHERE (b.driver_id = ? OR b.status = 'requested')
    `;
    const params = [driver.id];

    if (status && status !== 'all') {
      if (status === 'active') {
        sql += ` AND b.status IN ('accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop')`;
      } else if (status === 'requested') {
        sql += ` AND b.status = 'requested'`;
      } else {
        sql += ` AND b.status = ?`;
        params.push(status);
      }
    }

    sql += ` ORDER BY CASE WHEN b.status = 'requested' THEN 0 ELSE 1 END, b.created_at DESC`;
    const bookings = await allAsync(sql, params);
    return res.json({ bookings, driver });
  } catch (error) {
    console.error('getDriverBookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch driver bookings.' });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const driver = await getAsync('SELECT * FROM drivers WHERE user_id = ?', [req.user.id]);
    if (!driver) {
      return res.status(403).json({ error: 'Only registered drivers can accept bookings.' });
    }
    if (driver.verification_status !== 'approved') {
      return res.status(403).json({ error: 'Your account is pending verification. You cannot accept trips yet.' });
    }

    const bookingId = req.params.id;
    const booking = await getAsync('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.status !== 'requested') {
      return res.status(400).json({ error: 'Booking is no longer available for acceptance.' });
    }

    await runAsync(`
      UPDATE bookings
      SET driver_id = ?, status = 'accepted'
      WHERE id = ?
    `, [driver.id, bookingId]);

    // Customer notification
    await runAsync(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, 'Driver Accepted Trip 🚛', ?, 'booking_update', ?)
    `, [
      'notif_' + uuidv4().substring(0, 8),
      booking.customer_id,
      `Driver ${req.user.name} accepted your trip #${booking.booking_number}. Pickup OTP is ${booking.pickup_otp}.`,
      `/customer?tab=track&booking=${bookingId}`
    ]);

    const updated = await getBookingFull(bookingId);
    return res.json({ message: 'Booking accepted successfully.', booking: updated });
  } catch (error) {
    console.error('acceptBooking error:', error);
    return res.status(500).json({ error: 'Failed to accept booking.' });
  }
};

const updateTripStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status, otp } = req.body;

    const validStatuses = ['accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid trip status transition.' });
    }

    const booking = await getAsync('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // OTP security validation
    if (status === 'goods_loaded') {
      if (!otp || otp.toString().trim() !== booking.pickup_otp) {
        return res.status(400).json({ error: 'Invalid Pickup OTP. Please ask customer for the 4-digit pickup code.' });
      }
    }

    if (status === 'completed') {
      if (!otp || otp.toString().trim() !== booking.delivery_otp) {
        return res.status(400).json({ error: 'Invalid Delivery OTP. Please ask recipient for the 4-digit completion code.' });
      }
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const paymentStatus = status === 'completed' ? 'paid' : booking.payment_status;

    await runAsync(`
      UPDATE bookings
      SET status = ?,
          payment_status = ?,
          completed_at = COALESCE(?, completed_at)
      WHERE id = ?
    `, [status, paymentStatus, completedAt, bookingId]);

    // If trip completed, credit driver wallet & ledger
    if (status === 'completed' && booking.driver_id) {
      await runAsync(`
        UPDATE drivers
        SET wallet_balance = wallet_balance + ?,
            total_earnings = total_earnings + ?,
            total_trips = total_trips + 1
        WHERE id = ?
      `, [booking.driver_earnings, booking.driver_earnings, booking.driver_id]);

      // Ledger transaction for driver earning
      await runAsync(`
        INSERT INTO transactions (id, booking_id, user_id, type, amount, payment_method, reference_id, status, notes)
        VALUES (?, ?, ?, 'booking_payment', ?, ?, ?, 'success', ?)
      `, [
        'tx_' + uuidv4().substring(0, 10),
        bookingId,
        booking.customer_id,
        booking.total_fare,
        booking.payment_method,
        'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
        `Trip #${booking.booking_number} completed. Total fare collected.`
      ]);

      // Platform commission ledger
      const driverRecord = await getAsync('SELECT user_id FROM drivers WHERE id = ?', [booking.driver_id]);
      const driverUserId = driverRecord ? driverRecord.user_id : booking.driver_id;

      await runAsync(`
        INSERT INTO transactions (id, booking_id, user_id, type, amount, payment_method, reference_id, status, notes)
        VALUES (?, ?, ?, 'driver_commission', ?, 'system_deduction', ?, 'success', ?)
      `, [
        'tx_' + uuidv4().substring(0, 10),
        bookingId,
        driverUserId,
        booking.platform_commission,
        'COMM-' + Math.floor(10000000 + Math.random() * 90000000),
        `Platform commission fee for trip #${booking.booking_number}`
      ]);

      // Notify customer to leave review
      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Goods Delivered! 🎉', ?, 'booking_update', ?)
      `, [
        'notif_' + uuidv4().substring(0, 8),
        booking.customer_id,
        `Your shipment #${booking.booking_number} was successfully delivered. Please rate your driver!`,
        `/customer?tab=history&review=${bookingId}`
      ]);
    }

    const updated = await getBookingFull(bookingId);
    return res.json({
      message: `Trip status updated to ${status}.`,
      booking: updated
    });
  } catch (error) {
    console.error('updateTripStatus error:', error);
    return res.status(500).json({ error: 'Failed to update trip status.', details: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await getAsync('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot cancel booking that is already ${booking.status}.` });
    }

    await runAsync(`
      UPDATE bookings
      SET status = 'cancelled',
          cancel_reason = ?,
          cancelled_by = ?
      WHERE id = ?
    `, [reason || 'Cancelled by user', req.user.role, bookingId]);

    const updated = await getBookingFull(bookingId);
    return res.json({ message: 'Booking has been cancelled.', booking: updated });
  } catch (error) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking.' });
  }
};

const getTracking = async (req, res) => {
  try {
    const booking = await getBookingFull(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Compute realistic waypoint simulation coordinates
    const pLat = booking.pickup_lat || 12.9352;
    const pLng = booking.pickup_lng || 77.6245;
    const dLat = booking.drop_lat || 12.9815;
    const dLng = booking.drop_lng || 77.7289;

    let progressRatio = 0.0;
    switch (booking.status) {
      case 'requested': progressRatio = 0.05; break;
      case 'accepted': progressRatio = 0.20; break;
      case 'arrived_pickup': progressRatio = 0.35; break;
      case 'goods_loaded': progressRatio = 0.50; break;
      case 'in_transit': progressRatio = 0.75; break;
      case 'arrived_drop': progressRatio = 0.95; break;
      case 'completed': progressRatio = 1.0; break;
      default: progressRatio = 0.0;
    }

    const currentLat = +(pLat + (dLat - pLat) * progressRatio).toFixed(6);
    const currentLng = +(pLng + (dLng - pLng) * progressRatio).toFixed(6);

    const remainingMins = Math.max(2, Math.round(booking.estimated_duration_mins * (1 - progressRatio)));

    return res.json({
      booking_id: booking.id,
      status: booking.status,
      current_location: {
        lat: currentLat,
        lng: currentLng
      },
      pickup_location: {
        lat: pLat,
        lng: pLng,
        address: booking.pickup_address
      },
      drop_location: {
        lat: dLat,
        lng: dLng,
        address: booking.drop_address
      },
      progress_percent: Math.round(progressRatio * 100),
      eta_minutes: remainingMins,
      driver: {
        name: booking.driver_name,
        phone: booking.driver_phone,
        vehicle_model: booking.vehicle_model,
        vehicle_plate: booking.vehicle_plate,
        rating: booking.driver_rating
      },
      pickup_otp: booking.pickup_otp,
      delivery_otp: booking.delivery_otp
    });
  } catch (error) {
    console.error('getTracking error:', error);
    return res.status(500).json({ error: 'Failed to fetch tracking data.' });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  getCustomerBookings,
  getDriverBookings,
  acceptBooking,
  updateTripStatus,
  cancelBooking,
  getTracking
};
