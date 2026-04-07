const router = require('express').Router();
const upload = require('../middleware/upload');
const { verifyToken, isAdminOrStaff } = require('../middleware/auth');

router.post('/', verifyToken, isAdminOrStaff, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const path = `/uploads/${req.file.filename}`;
  res.json({ path, url: path });
});

module.exports = router;
