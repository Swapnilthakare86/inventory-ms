const db = require('../config/db');

const logAction = async (userId, action, details) => {
  try {
    await db.query('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)', [userId, action, details]);
  } catch (err) {
    console.error('Logging error:', err.message);
  }
};

module.exports = { logAction };
