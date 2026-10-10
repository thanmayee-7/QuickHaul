const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

const getDashboardStats = async (req, res) => {
  try {
    // User counts
    const userCounts = await getAsync(`
      SELECT
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers_count,
        COUNT(CASE WHEN role = 'driver' THEN 1 END) as drivers_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users_count
      FROM users
    `);

    // Booking counts and financials
    const bookingStats = await getAsync(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status IN ('requested', 'accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop') THEN 1 END) as active_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_fare ELSE 0 END), 0) as total_gmv,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN platform_commission ELSE 0 END), 0) as total_platform_commission,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN driver_earnings ELSE 0 END), 0) as total_driver_payouts
      FROM bookings
    `);

    // Drivers breakdown
    const driverStats = await getAsync(`
      SELECT
        COUNT(CASE WHEN is_online = 1 THEN 1 END) as online_drivers,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_verifications,
        COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_drivers
      FROM drivers
    `);

    // Support tickets
    const ticketStats = await getAsync(`
      SELECT
        COUNT(CASE WHEN status IN ('open', 'in_progress') THEN 1 END) as open_tickets,
        COUNT(*) as total_tickets
      FROM support_tickets
    `);

    // Category distribution
    const categoryVolume = await allAsync(`
      SELECT vc.name, COUNT(b.id) as booking_count, COALESCE(SUM(b.total_fare), 0) as revenue
      FROM vehicle_categories vc
      LEFT JOIN bookings b ON vc.id = b.vehicle_category_id
      GROUP BY vc.id
    `);

    return res.json({
      metrics: {
        customers: userCounts?.customers_count || 0,
        drivers: userCounts?.drivers_count || 0,
        online_drivers: driverStats?.online_drivers || 0,
        pending_verifications: driverStats?.pending_verifications || 0,
        approved_drivers: driverStats?.approved_drivers || 0,
        total_bookings: bookingStats?.total_bookings || 0,
        active_bookings: bookingStats?.active_bookings || 0,
        completed_bookings: bookingStats?.completed_bookings || 0,
        cancelled_bookings: bookingStats?.cancelled_bookings || 0,
        total_gmv: +(bookingStats?.total_gmv || 0).toFixed(2),
        total_platform_commission: +(bookingStats?.total_platform_commission || 0).toFixed(2),
        total_driver_payouts: +(bookingStats?.total_driver_payouts || 0).toFixed(2),
        open_support_tickets: ticketStats?.open_tickets || 0
      },
      category_volume: categoryVolume
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
};

const getDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT
        d.*,
        u.name,
        u.email,
        u.phone,
        u.avatar_url,
        u.status as user_status,
        vc.name as category_name
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      JOIN vehicle_categories vc ON d.vehicle_category_id = vc.id
    `;
    const params = [];
    if (status) {
      sql += ` WHERE d.verification_status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY d.created_at DESC`;

    const drivers = await allAsync(sql, params);
    return res.json({ drivers });
  } catch (error) {
    console.error('getDrivers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve drivers.' });
  }
};

const verifyDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { action, rejection_reason } = req.body; // action: 'approve' | 'reject'

    const driver = await getAsync('SELECT * FROM drivers WHERE id = ?', [driverId]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    if (action === 'approve') {
      await runAsync(`
        UPDATE drivers
        SET is_verified = 1,
            verification_status = 'approved',
            rejection_reason = NULL
        WHERE id = ?
      `, [driverId]);

      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Account Verified! 🛡️', 'Your driver documents have been approved by QuickHaul Admin. You can now go ONLINE and accept trips!', 'verification', '/driver?tab=active')
      `, ['notif_' + uuidv4().substring(0, 8), driver.user_id]);
    } else if (action === 'reject') {
      await runAsync(`
        UPDATE drivers
        SET is_verified = 0,
            verification_status = 'rejected',
            rejection_reason = ?
        WHERE id = ?
      `, [rejection_reason || 'Documents could not be validated. Please re-upload clear copies.', driverId]);

      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Verification Action Required ⚠️', ?, 'verification', '/driver?tab=profile')
      `, ['notif_' + uuidv4().substring(0, 8), driver.user_id, `Your verification was rejected: ${rejection_reason || 'Please upload valid driving license and RC.'}`]);
    } else {
      return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'." });
    }

    const updated = await getAsync('SELECT * FROM drivers WHERE id = ?', [driverId]);
    return res.json({ message: `Driver verification set to ${action}.`, driver: updated });
  } catch (error) {
    console.error('verifyDriver error:', error);
    return res.status(500).json({ error: 'Failed to update driver verification.' });
  }
};

const getBookings = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT
        b.*,
        vc.name as category_name,
        cu.name as customer_name,
        cu.email as customer_email,
        cu.phone as customer_phone,
        du.name as driver_name,
        du.phone as driver_phone,
        d.vehicle_plate
      FROM bookings b
      LEFT JOIN vehicle_categories vc ON b.vehicle_category_id = vc.id
      LEFT JOIN users cu ON b.customer_id = cu.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND b.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (b.booking_number LIKE ? OR cu.name LIKE ? OR du.name LIKE ? OR b.pickup_address LIKE ? OR b.drop_address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY b.created_at DESC`;
    const bookings = await allAsync(sql, params);
    return res.json({ bookings });
  } catch (error) {
    console.error('getBookings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await allAsync(`
      SELECT id, name, email, phone, role, avatar_url, status, created_at,
        (SELECT COUNT(*) FROM bookings WHERE customer_id = users.id) as customer_bookings_count
      FROM users
      ORDER BY created_at DESC
    `);
    return res.json({ users });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body; // 'active' | 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid user status.' });
    }

    await runAsync('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    const updated = await getAsync('SELECT id, name, email, phone, role, status FROM users WHERE id = ?', [userId]);

    return res.json({ message: `User status changed to ${status}.`, user: updated });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    return res.status(500).json({ error: 'Failed to toggle user status.' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await allAsync(`
      SELECT t.*, u.name as user_name, u.email as user_email, u.role as user_role, b.booking_number
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN bookings b ON t.booking_id = b.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    return res.json({ transactions });
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
};

const updateCategoryPricing = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { base_fare, per_km_rate, helper_rate, commission_percent } = req.body;

    await runAsync(`
      UPDATE vehicle_categories
      SET base_fare = COALESCE(?, base_fare),
          per_km_rate = COALESCE(?, per_km_rate),
          helper_rate = COALESCE(?, helper_rate),
          commission_percent = COALESCE(?, commission_percent)
      WHERE id = ?
    `, [base_fare, per_km_rate, helper_rate, commission_percent, categoryId]);

    const updated = await getAsync('SELECT * FROM vehicle_categories WHERE id = ?', [categoryId]);
    return res.json({ message: 'Category pricing updated.', category: updated });
  } catch (error) {
    console.error('updateCategoryPricing error:', error);
    return res.status(500).json({ error: 'Failed to update category pricing.' });
  }
};

module.exports = {
  getDashboardStats,
  getDrivers,
  verifyDriver,
  getBookings,
  getUsers,
  toggleUserStatus,
  getTransactions,
  updateCategoryPricing
};
