const pool = require('../config/db');

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee } = req.query;
    let query = `
      SELECT t.*, u.name AS assignee_name, u.avatar AS assignee_avatar, c.name AS creator_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = ?
    `;
    const params = [req.params.projectId];
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
    if (assignee) { query += ' AND t.assignee_id = ?'; params.push(assignee); }
    query += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee_id, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });
    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status || 'todo', priority || 'medium',
       req.params.projectId, assignee_id || null, req.user.id, due_date || null]
    );
    const [rows] = await pool.query(`
      SELECT t.*, u.name AS assignee_name, u.avatar AS assignee_avatar
      FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?
    `, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee_id, due_date } = req.body;
    await pool.query(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=?, updated_at=NOW()
       WHERE id=? AND project_id=?`,
      [title, description, status, priority, assignee_id || null, due_date || null,
       req.params.taskId, req.params.projectId]
    );
    const [rows] = await pool.query(`
      SELECT t.*, u.name AS assignee_name, u.avatar AS assignee_avatar
      FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?
    `, [req.params.taskId]);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ? AND project_id = ?',
      [req.params.taskId, req.params.projectId]);
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};

const getComments = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.avatar FROM comments c
      JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC
    `, [req.params.taskId]);
    res.json(rows);
  } catch (err) { next(err); }
};

const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment cannot be empty' });
    const [result] = await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.taskId, req.user.id, content]
    );
    const [rows] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.avatar FROM comments c
      JOIN users u ON u.id = c.user_id WHERE c.id = ?
    `, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getComments, addComment };
