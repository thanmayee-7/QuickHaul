const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

const toggleOnline = async (req, res) => {
  try {
    const { is_online } = req.body;
    const driver = await getAsync('SELECT * FROM drivers WHERE user_id = ?', [req.user.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const onlineStatus = is_online ? 1 : 0;
    await runAsync('UPDATE drivers SET is_online = ? WHERE id = ?', [onlineStatus, driver.id]);

    return res.json({
      message: `Driver status switched to ${onlineStatus ? 'ONLINE' : 'OFFLINE'}.`,
      is_online: onlineStatus
    });
  } catch (error) {
    console.error('toggleOnline error:', error);
    return res.status(500).json({ error: 'Failed to toggle driver availability.' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng, area_name } = req.body;
    const driver = await getAsync('SELECT id FROM drivers WHERE user_id = ?', [req.user.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    await runAsync(`
      UPDATE drivers
      SET current_lat = COALESCE(?, current_lat),
          current_lng = COALESCE(?, current_lng),
          current_area = COALESCE(?, current_area)
      WHERE id = ?
    `, [lat, lng, area_name, driver.id]);

    return res.json({ message: 'Driver location updated.' });
  } catch (error) {
    console.error('updateLocation error:', error);
    return res.status(500).json({ error: 'Failed to update location.' });
  }
};

const updateDocuments = async (req, res) => {
  try {
    const { dl_url, rc_url, insurance_url, id_url, license_number, vehicle_plate, vehicle_model, vehicle_category_id } = req.body;
    const driver = await getAsync('SELECT id FROM drivers WHERE user_id = ?', [req.user.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    await runAsync(`
      UPDATE drivers
      SET dl_document_url = COALESCE(?, dl_document_url),
          rc_document_url = COALESCE(?, rc_document_url),
          insurance_document_url = COALESCE(?, insurance_document_url),
          id_document_url = COALESCE(?, id_document_url),
          license_number = COALESCE(?, license_number),
          vehicle_plate = COALESCE(?, vehicle_plate),
          vehicle_model = COALESCE(?, vehicle_model),
          vehicle_category_id = COALESCE(?, vehicle_category_id),
          verification_status = 'pending'
      WHERE id = ?
    `, [dl_url, rc_url, insurance_url, id_url, license_number, vehicle_plate, vehicle_model, vehicle_category_id, driver.id]);

    // Send notification to admin
    await runAsync(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, 'usr_admin_01', 'Driver Documents Updated', ?, 'verification', '/admin?tab=drivers')
    `, ['notif_' + uuidv4().substring(0, 8), `Driver ${req.user.name} submitted updated documents for review.`]);

    const updated = await getAsync('SELECT * FROM drivers WHERE id = ?', [driver.id]);
    return res.json({ message: 'Documents updated and submitted for verification.', driver: updated });
  } catch (error) {
    console.error('updateDocuments error:', error);
    return res.status(500).json({ error: 'Failed to update driver documents.' });
  }
};

const getEarningsDashboard = async (req, res) => {
  try {
    const driver = await getAsync(`
      SELECT d.*, vc.name as category_name
      FROM drivers d
      JOIN vehicle_categories vc ON d.vehicle_category_id = vc.id
      WHERE d.user_id = ?
    `, [req.user.id]);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    // Recent completed trips
    const completedTrips = await allAsync(`
      SELECT b.id, b.booking_number, b.pickup_address, b.drop_address,
             b.distance_km, b.total_fare, b.driver_earnings, b.platform_commission,
             b.payment_method, b.created_at, b.completed_at
      FROM bookings b
      WHERE b.driver_id = ? AND b.status = 'completed'
      ORDER BY b.completed_at DESC
      LIMIT 10
    `, [driver.id]);

    // Calculate today's earnings
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = await getAsync(`
      SELECT COUNT(*) as today_trips, COALESCE(SUM(driver_earnings), 0) as today_earnings
      FROM bookings
      WHERE driver_id = ? AND status = 'completed' AND completed_at LIKE ?
    `, [driver.id, `${today}%`]);

    // Transactions / Payouts
    const transactions = await allAsync(`
      SELECT * FROM transactions
      WHERE user_id = ? OR booking_id IN (SELECT id FROM bookings WHERE driver_id = ?)
      ORDER BY created_at DESC
      LIMIT 10
    `, [driver.id, driver.id]);

    return res.json({
      driver: {
        id: driver.id,
        wallet_balance: driver.wallet_balance,
        total_earnings: driver.total_earnings,
        total_trips: driver.total_trips,
        rating_avg: driver.rating_avg,
        rating_count: driver.rating_count,
        verification_status: driver.verification_status,
        is_online: driver.is_online
      },
      today: {
        trips: todayStats?.today_trips || 0,
        earnings: todayStats?.today_earnings || 0
      },
      completed_trips: completedTrips,
      transactions
    });
  } catch (error) {
    console.error('getEarningsDashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch earnings dashboard.' });
  }
};

const requestPayout = async (req, res) => {
  try {
    const { amount, payout_method = 'upi', account_details } = req.body;
    const driver = await getAsync('SELECT * FROM drivers WHERE user_id = ?', [req.user.id]);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid payout amount.' });
    }

    if (withdrawAmount > driver.wallet_balance) {
      return res.status(400).json({ error: `Insufficient wallet balance. Available: ₹${driver.wallet_balance}` });
    }

    const minWithdrawal = 500.0;
    if (withdrawAmount < minWithdrawal) {
      return res.status(400).json({ error: `Minimum payout threshold is ₹${minWithdrawal}.` });
    }

    // Deduct from wallet
    await runAsync('UPDATE drivers SET wallet_balance = wallet_balance - ? WHERE id = ?', [withdrawAmount, driver.id]);

    const txId = 'tx_' + uuidv4().substring(0, 10);
    const refId = 'PAYOUT-' + Math.floor(10000000 + Math.random() * 90000000);

    await runAsync(`
      INSERT INTO transactions (id, user_id, type, amount, payment_method, reference_id, status, notes)
      VALUES (?, ?, 'driver_payout', ?, ?, ?, 'success', ?)
    `, [txId, req.user.id, withdrawAmount, payout_method, refId, `Driver wallet payout transfer to: ${account_details || 'Verified Bank Account'}`]);

    return res.json({
      message: `Payout of ₹${withdrawAmount.toFixed(2)} processed successfully to your account.`,
      transaction_id: txId,
      reference_id: refId,
      remaining_balance: +(driver.wallet_balance - withdrawAmount).toFixed(2)
    });
  } catch (error) {
    console.error('requestPayout error:', error);
    return res.status(500).json({ error: 'Failed to process payout request.' });
  }
};

module.exports = {
  toggleOnline,
  updateLocation,
  updateDocuments,
  getEarningsDashboard,
  requestPayout
};
