const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

// Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return done(null, false, { message: 'No user with that email' });
    if (!user.password) return done(null, false, { message: 'Please login with Google' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'Incorrect password' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return done(null, rows[0]);
    }
    const [result] = await pool.query(
      'INSERT INTO users (name, email, avatar, google_id) VALUES (?, ?, ?, ?)',
      [profile.displayName, email, profile.photos[0]?.value, profile.id]
    );
    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return done(null, newUser[0]);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
