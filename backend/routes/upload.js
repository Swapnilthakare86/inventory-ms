const router  = require('express').Router();
const multer  = require('multer');
const { uploadToS3 } = require('../middleware/upload');
const { verifyToken, isAdminOrStaff } = require('../middleware/auth');

const memUpload = multer({ storage: multer.memoryStorage() });

router.post('/', verifyToken, isAdminOrStaff, memUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = await uploadToS3(req.file);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;