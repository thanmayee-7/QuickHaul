const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'quickhaul.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to QuickHaul SQLite database at:', dbPath);
  }
});

// Enable WAL mode & foreign keys for performance and data integrity
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Promisified helpers
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initSchema = async () => {
  // Users table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'driver', 'admin')),
      avatar_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vehicle Categories and Pricing Configuration
  await runAsync(`
    CREATE TABLE IF NOT EXISTS vehicle_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      badge TEXT,
      max_payload_kg INTEGER NOT NULL,
      dimensions_feet TEXT NOT NULL,
      volume_cuft INTEGER NOT NULL,
      base_fare REAL NOT NULL,
      base_km_included REAL NOT NULL,
      per_km_rate REAL NOT NULL,
      helper_rate REAL NOT NULL,
      commission_percent REAL DEFAULT 15.0,
      image_icon TEXT,
      popular_use TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Drivers table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      license_number TEXT NOT NULL,
      vehicle_category_id TEXT NOT NULL,
      vehicle_model TEXT NOT NULL,
      vehicle_plate TEXT NOT NULL,
      experience_years INTEGER DEFAULT 3,
      is_online INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
      current_lat REAL DEFAULT 12.9716,
      current_lng REAL DEFAULT 77.5946,
      current_area TEXT DEFAULT 'Central Hub, Indiranagar',
      rating_avg REAL DEFAULT 4.9,
      rating_count INTEGER DEFAULT 1,
      total_trips INTEGER DEFAULT 0,
      wallet_balance REAL DEFAULT 1500.00,
      total_earnings REAL DEFAULT 0.00,
      dl_document_url TEXT,
      rc_document_url TEXT,
      insurance_document_url TEXT,
      id_document_url TEXT,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_category_id) REFERENCES vehicle_categories(id)
    )
  `);

  // Bookings table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      driver_id TEXT,
      vehicle_category_id TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      pickup_lat REAL NOT NULL,
      pickup_lng REAL NOT NULL,
      pickup_contact_name TEXT,
      pickup_contact_phone TEXT,
      drop_address TEXT NOT NULL,
      drop_lat REAL NOT NULL,
      drop_lng REAL NOT NULL,
      drop_contact_name TEXT,
      drop_contact_phone TEXT,
      distance_km REAL NOT NULL,
      estimated_duration_mins INTEGER NOT NULL,
      goods_type TEXT NOT NULL,
      goods_description TEXT,
      approx_weight_kg INTEGER,
      helper_needed INTEGER DEFAULT 0,
      fragile_handling INTEGER DEFAULT 0,
      base_fare REAL NOT NULL,
      distance_fare REAL NOT NULL,
      helper_fare REAL DEFAULT 0.0,
      gst_tax REAL NOT NULL,
      discount_amount REAL DEFAULT 0.0,
      total_fare REAL NOT NULL,
      driver_earnings REAL NOT NULL,
      platform_commission REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash_on_delivery' CHECK(payment_method IN ('cash_on_delivery', 'upi', 'card', 'wallet')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
      status TEXT DEFAULT 'requested' CHECK(status IN ('requested', 'accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop', 'completed', 'cancelled')),
      pickup_otp TEXT NOT NULL,
      delivery_otp TEXT NOT NULL,
      cancel_reason TEXT,
      cancelled_by TEXT,
      scheduled_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_category_id) REFERENCES vehicle_categories(id)
    )
  `);

  // Payments / Transactions Ledger
  await runAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('booking_payment', 'driver_payout', 'driver_commission', 'wallet_recharge', 'refund')),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'success' CHECK(status IN ('success', 'pending', 'failed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Reviews table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      punctuality_rating INTEGER DEFAULT 5,
      handling_rating INTEGER DEFAULT 5,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    )
  `);

  // Notifications table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Support Tickets table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      booking_id TEXT,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      admin_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  // Driver Location & Route Simulation Log
  await runAsync(`
    CREATE TABLE IF NOT EXISTS trip_tracking_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      step_index INTEGER NOT NULL,
      status_checkpoint TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  console.log('QuickHaul database schema initialized successfully.');
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  initSchema
};
