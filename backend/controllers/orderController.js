const db = require('../config/db');
const { logAction } = require('../utils/logger');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name AS user_name, u.address, p.name AS product_name, c.name AS category_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.cancelMyOrder = async (req, res, next) => {
  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Order already cancelled.' });
    if (order.status !== 'placed') return res.status(400).json({ message: 'Only placed orders can be cancelled.' });

    await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [order.quantity, order.product_id]);
    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    await logAction(req.user.id, 'CANCEL_ORDER', `User cancelled order ${req.params.id}`);

    res.json({ message: 'Order cancelled.' });
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, p.name AS product_name, c.name AS category_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.placeOrder = async (req, res, next) => {
  const { product_id, quantity } = req.body;
  const conn = await (require('../config/db')).getConnection();
  try {
    await conn.beginTransaction();
    const [[product]] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!product) throw new Error('Product not found.');
    if (product.stock < quantity) throw new Error('Not enough stock.');
    const total = product.price * quantity;
    await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);
    const [result] = await conn.query(
      'INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, quantity, total]
    );
    await conn.commit();
    await logAction(req.user.id, 'PLACE_ORDER', `Order placed: product_id=${product_id}, qty=${quantity}`);
    res.status(201).json({ message: 'Order placed.', id: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status === 'cancelled' && status === 'cancelled')
      return res.status(400).json({ message: 'Order already cancelled.' });
    if (status === 'cancelled' && order.status !== 'cancelled')
      await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [order.quantity, order.product_id]);
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    await logAction(req.user.id, 'UPDATE_ORDER_STATUS', `Order ${req.params.id} → ${status}`);
    res.json({ message: `Order marked as ${status}.` });
  } catch (err) { next(err); }
};
