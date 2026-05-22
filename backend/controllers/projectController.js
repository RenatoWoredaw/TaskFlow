const pool = require('../config/db');

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      JOIN users u ON u.id = p.owner_id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description, req.user.id]
    );
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'owner']
    );
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name AS owner_name FROM projects p
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Project not found' });
    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar, pm.role
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `, [req.params.id]);
    res.json({ ...rows[0], members });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    await pool.query('UPDATE projects SET name = ?, description = ? WHERE id = ? AND owner_id = ?',
      [name, description, req.params.id, req.user.id]);
    res.json({ message: 'Project updated' });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    await pool.query(
      'INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, users[0].id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
