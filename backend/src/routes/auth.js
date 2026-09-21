import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart_energy_guardian_super_secret_jwt_key_2026';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, tariff_rate) VALUES (?, ?, ?, 8.50)',
      [name || email.split('@')[0], email, passwordHash]
    );

    const userId = result.insertId;

    // Create a default device for the user
    const devCode = `SG-${String(userId).padStart(3, '0')}`;
    const devResult = await query(
      `INSERT INTO devices (device_code, device_name, user_id, status, wifi_status, wifi_ssid, rssi, firmware_version, hardware_type)
       VALUES (?, ?, ?, 'ONLINE', 'Connected', 'HomeNetwork_5G', -52, 'v1.0.0', 'ESP32')`,
      [devCode, `Smart Energy Guardian #${String(userId).padStart(3, '0')}`, userId]
    );

    const deviceId = devResult.insertId;

    // Create sockets 1 and 2
    await query(
      `INSERT INTO sockets (device_id, socket_number, name, relay_state, current_appliance, confidence, normal_range_min, normal_range_max)
       VALUES 
         (?, 1, 'Socket 1', 'ON', 'Fan', 94.00, 60.0, 110.0),
         (?, 2, 'Socket 2', 'ON', 'Laptop', 91.00, 40.0, 80.0)`,
      [deviceId, deviceId]
    );

    // Create default settings
    await query(
      `INSERT INTO device_settings (device_id) VALUES (?)`,
      [deviceId]
    );

    const token = jwt.sign(
      { id: userId, email, name: name || email.split('@')[0] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, name: name || email.split('@')[0], email, tariff_rate: 8.50 }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tariff_rate: parseFloat(user.tariff_rate)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const rows = await query('SELECT id, name, email, tariff_rate, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        tariff_rate: parseFloat(u.tariff_rate),
        created_at: u.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;

