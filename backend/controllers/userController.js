const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT id, name, email, role, address, created_at FROM users');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name, email, password, address, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashed, address, role]
  );
  res.status(201).json({ message: 'User created.', id: result.insertId });
};

exports.remove = async (req, res) => {
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted.' });
};

exports.updateProfile = async (req, res) => {
  const { name, address } = req.body;
  await db.query('UPDATE users SET name=?, address=? WHERE id=?', [name, address, req.user.id]);
  res.json({ message: 'Profile updated.' });
};