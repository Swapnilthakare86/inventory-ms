const db = require('../config/db');
const { logAction } = require('../utils/logger');
const { normalizeImagePath } = require('../utils/imagePath');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
    `);
    res.json(rows.map((row) => ({ ...row, image: normalizeImagePath(row.image) })));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, category_id, supplier_id, price, stock, image } = req.body;
    const normalizedImage = normalizeImagePath(image);
    const [result] = await db.query(
      'INSERT INTO products (name, category_id, supplier_id, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category_id, supplier_id, price, stock, normalizedImage]
    );
    await logAction(req.user.id, 'CREATE_PRODUCT', `Product created: ${name}`);
    res.status(201).json({ message: 'Product created.', id: result.insertId });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, category_id, supplier_id, price, stock, image } = req.body;
    const normalizedImage = normalizeImagePath(image);
    await db.query(
      'UPDATE products SET name=?, category_id=?, supplier_id=?, price=?, stock=?, image=? WHERE id=?',
      [name, category_id, supplier_id, price, stock, normalizedImage, req.params.id]
    );
    await logAction(req.user.id, 'UPDATE_PRODUCT', `Product updated: id=${req.params.id}`);
    res.json({ message: 'Product updated.' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'DELETE_PRODUCT', `Product deleted: id=${req.params.id}`);
    res.json({ message: 'Product deleted.' });
  } catch (err) { next(err); }
};
