const pool = require('../config/db');

const getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead };
