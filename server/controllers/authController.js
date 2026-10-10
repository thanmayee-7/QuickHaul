const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync } = require('../db');
const { generateToken } = require('../middleware/auth');

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, driverDetails } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['customer', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    // Check if email already in use
    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const userId = 'usr_' + uuidv4().substring(0, 10);
    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7`;

    await runAsync(`
      INSERT INTO users (id, name, email, phone, password_hash, role, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `, [userId, name.trim(), email.toLowerCase().trim(), phone || '', passwordHash, role, defaultAvatar]);

    // If driver, initialize driver profile
    let driverProfile = null;
    if (role === 'driver') {
      const driverId = 'drv_' + uuidv4().substring(0, 10);
      const vehicleCategory = driverDetails?.vehicle_category_id || 'tata_ace';
      const licenseNumber = driverDetails?.license_number || `DL-${Math.floor(10 + Math.random() * 89)}-${Date.now().toString().slice(-6)}`;
      const vehicleModel = driverDetails?.vehicle_model || 'Tata Ace Gold';
      const vehiclePlate = driverDetails?.vehicle_plate || `KA-01-QH-${Math.floor(1000 + Math.random() * 9000)}`;

      await runAsync(`
        INSERT INTO drivers (
          id, user_id, license_number, vehicle_category_id, vehicle_model, vehicle_plate,
          experience_years, is_online, is_verified, verification_status,
          current_lat, current_lng, current_area, rating_avg, rating_count, total_trips,
          wallet_balance, total_earnings, dl_document_url, rc_document_url, insurance_document_url, id_document_url
        ) VALUES (?, ?, ?, ?, ?, ?, 3, 1, 0, 'pending', 12.9716, 77.5946, 'Bangalore Central', 5.0, 0, 0, 1000.00, 0.00, ?, ?, ?, ?)
      `, [
        driverId, userId, licenseNumber, vehicleCategory, vehicleModel, vehiclePlate,
        driverDetails?.dl_document_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        driverDetails?.rc_document_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        driverDetails?.insurance_document_url || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        driverDetails?.id_document_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
      ]);

      // Notification for admin
      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, 'usr_admin_01', 'New Driver Registered', ?, 'verification', '/admin?tab=drivers')
      `, ['notif_' + uuidv4().substring(0, 8), `Driver ${name} (${vehicleModel}) registered and awaits document verification.`]);

      driverProfile = await getAsync('SELECT * FROM drivers WHERE id = ?', [driverId]);
    }

    const createdUser = await getAsync('SELECT id, name, email, phone, role, avatar_url, status, created_at FROM users WHERE id = ?', [userId]);
    const token = generateToken(createdUser);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: createdUser,
      driverProfile
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.', details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your QuickHaul account has been suspended.' });
    }

    let driverProfile = null;
    if (user.role === 'driver') {
      driverProfile = await getAsync(`
        SELECT d.*, c.name as category_name, c.tagline as category_tagline, c.max_payload_kg
        FROM drivers d
        JOIN vehicle_categories c ON d.vehicle_category_id = c.id
        WHERE d.user_id = ?
      `, [user.id]);
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({
      message: 'Login successful.',
      token,
      user: safeUser,
      driverProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to sign in.', details: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    let driverProfile = null;
    if (req.user.role === 'driver') {
      driverProfile = await getAsync(`
        SELECT d.*, c.name as category_name, c.tagline as category_tagline, c.max_payload_kg
        FROM drivers d
        JOIN vehicle_categories c ON d.vehicle_category_id = c.id
        WHERE d.user_id = ?
      `, [req.user.id]);
    }

    return res.json({
      user: req.user,
      driverProfile
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    await runAsync(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `, [name, phone, avatar_url, req.user.id]);

    const updated = await getAsync('SELECT id, name, email, phone, role, avatar_url, status FROM users WHERE id = ?', [req.user.id]);
    return res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
