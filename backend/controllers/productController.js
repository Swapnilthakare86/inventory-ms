const db = require('../config/db');
const { logAction } = require('../middleware/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, category_id, supplier_id, price, stock } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (name, category_id, supplier_id, price, stock) VALUES (?, ?, ?, ?, ?)',
      [name, category_id, supplier_id, price, stock]
    );
    await logAction(req.user.id, 'CREATE_PRODUCT', `Product created: ${name}`);
    res.status(201).json({ message: 'Product created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, category_id, supplier_id, price, stock } = req.body;
  try {
    await db.query(
      'UPDATE products SET name=?, category_id=?, supplier_id=?, price=?, stock=? WHERE id=?',
      [name, category_id, supplier_id, price, stock, req.params.id]
    );
    await logAction(req.user.id, 'UPDATE_PRODUCT', `Product updated: id=${req.params.id}`);
    res.json({ message: 'Product updated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'DELETE_PRODUCT', `Product deleted: id=${req.params.id}`);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};