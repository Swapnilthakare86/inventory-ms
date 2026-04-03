const db = require('../config/db');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM suppliers');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name, email, phone, address } = req.body;
  const [result] = await db.query(
    'INSERT INTO suppliers (name, email, phone, address) VALUES (?, ?, ?, ?)',
    [name, email, phone, address]
  );
  res.status(201).json({ message: 'Supplier created.', id: result.insertId });
};

exports.update = async (req, res) => {
  const { name, email, phone, address } = req.body;
  await db.query(
    'UPDATE suppliers SET name=?, email=?, phone=?, address=? WHERE id=?',
    [name, email, phone, address, req.params.id]
  );
  res.json({ message: 'Supplier updated.' });
};

exports.remove = async (req, res) => {
  await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  res.json({ message: 'Supplier deleted.' });
};