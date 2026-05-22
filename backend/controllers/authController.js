const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );
    const [rows] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];
    res.status(201).json({ user, token: generateToken(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token: generateToken(safeUser) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Google OAuth success callback
const googleCallback = (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};

module.exports = { register, login, getMe, googleCallback };
