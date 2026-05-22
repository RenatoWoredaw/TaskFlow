const { pool } = require('../config/db');

// ─── Get user's teams ─────────────────────────────────────────────
const getTeams = async (req, res) => {
  try {
    const [teams] = await pool.query(`
      SELECT t.*, u.name AS owner_name,
        COUNT(DISTINCT tm.user_id) AS member_count
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.user_id = ?
      GROUP BY t.id
    `, [req.user.id]);
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teams.' });
  }
};

// ─── Create team ──────────────────────────────────────────────────
const createTeam = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Team name required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO teams (name, owner_id) VALUES (?, ?)',
      [name, req.user.id]
    );
    // Add owner as member
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'owner']
    );
    const [rows] = await pool.query('SELECT * FROM teams WHERE id = ?', [result.insertId]);
    res.status(201).json({ team: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create team.' });
  }
};

// ─── Get team members ─────────────────────────────────────────────
const getMembers = async (req, res) => {
  const { teamId } = req.params;
  try {
    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar, tm.role, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `, [teamId]);
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch members.' });
  }
};

// ─── Invite member by email ───────────────────────────────────────
const inviteMember = async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found.' });

    const userId = users[0].id;
    const [existing] = await pool.query(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    if (existing.length) return res.status(409).json({ message: 'User already in team.' });

    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
      [teamId, userId, role || 'member']
    );

    res.json({ message: `${email} added to team.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to invite member.' });
  }
};

// ─── Remove member ────────────────────────────────────────────────
const removeMember = async (req, res) => {
  const { teamId, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND role != "owner"',
      [teamId, userId]
    );
    res.json({ message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove member.' });
  }
};

module.exports = { getTeams, createTeam, getMembers, inviteMember, removeMember };
