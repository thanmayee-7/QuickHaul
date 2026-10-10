const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

const processPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, card_details, upi_vpa } = req.body;

    const booking = await getAsync('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Simulate gateway verification
    const refId = (payment_method === 'upi' ? 'UPI-' : 'CARD-') + Math.floor(10000000 + Math.random() * 90000000);
    const txId = 'tx_' + uuidv4().substring(0, 10);

    await runAsync(`
      INSERT INTO transactions (id, booking_id, user_id, type, amount, payment_method, reference_id, status, notes)
      VALUES (?, ?, ?, 'booking_payment', ?, ?, ?, 'success', ?)
    `, [
      txId,
      booking.id,
      req.user.id,
      booking.total_fare,
      payment_method,
      refId,
      `Payment processed successfully for trip #${booking.booking_number} via ${payment_method.toUpperCase()}`
    ]);

    await runAsync(`
      UPDATE bookings
      SET payment_status = 'paid',
          payment_method = ?
      WHERE id = ?
    `, [payment_method, booking.id]);

    return res.json({
      message: 'Payment completed successfully.',
      transaction: {
        id: txId,
        reference_id: refId,
        amount: booking.total_fare,
        payment_method,
        status: 'success',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('processPayment error:', error);
    return res.status(500).json({ error: 'Payment processing failed.' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await allAsync(`
      SELECT t.*, b.booking_number
      FROM transactions t
      LEFT JOIN bookings b ON t.booking_id = b.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    return res.json({ transactions });
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction history.' });
  }
};

module.exports = {
  processPayment,
  getTransactions
};
