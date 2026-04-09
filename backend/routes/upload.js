const router  = require('express').Router();
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const {
  multer: uploadMiddleware,
  uploadToS3,
  getMissingS3Env,
  getS3Client,
  resolveS3Object,
} = require('../middleware/upload');
const { verifyToken, isAdminOrStaff } = require('../middleware/auth');

const sendLocalUpload = (res, key) => {
  const relativeKey = String(key || '').replace(/^\/+/, '');
  const absolutePath = path.resolve(__dirname, '..', relativeKey);
  const uploadsRoot = path.resolve(__dirname, '..', 'uploads');

  if (!absolutePath.startsWith(uploadsRoot)) {
    return false;
  }

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(absolutePath);
  return true;
};

router.get('/file', async (req, res) => {
  try {
    const { src } = req.query;
    const { bucket, key } = resolveS3Object(src);

    // Keep legacy local uploads working before falling back to S3-backed images.
    if ((String(src || '').startsWith('/uploads/') || String(src || '').startsWith('uploads/')) && sendLocalUpload(res, key)) {
      return;
    }

    const missing = getMissingS3Env();
    if (missing.length > 0) {
      return res.status(500).json({ message: `Missing S3 configuration: ${missing.join(', ')}` });
    }

    const result = await getS3Client().send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (result.ContentType) {
      res.setHeader('Content-Type', result.ContentType);
    }

    if (typeof result.Body?.pipe === 'function') {
      result.Body.pipe(res);
      return;
    }

    if (typeof result.Body?.transformToByteArray === 'function') {
      const bytes = await result.Body.transformToByteArray();
      res.end(Buffer.from(bytes));
      return;
    }

    throw new Error('Unsupported S3 response body.');
  } catch (err) {
    const statusCode = err?.$metadata?.httpStatusCode;
    if (statusCode === 404 || err?.name === 'NoSuchKey') {
      return res.status(404).json({ message: 'Image not found.' });
    }

    res.status(500).json({ message: err.message || 'Failed to load image.' });
  }
});

router.post('/', verifyToken, isAdminOrStaff, uploadMiddleware.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = await uploadToS3(req.file);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
