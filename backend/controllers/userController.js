const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, address, created_at FROM users');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, address, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, address, role || 'user']
    );
    res.status(201).json({ message: 'User created.', id: result.insertId });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM orders WHERE user_id = ?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, address } = req.body;
    await db.query('UPDATE users SET name=?, address=? WHERE id=?', [name, address, req.user.id]);
    res.json({ message: 'Profile updated.' });
  } catch (err) { next(err); }
};
