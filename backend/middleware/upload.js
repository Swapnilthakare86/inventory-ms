const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only jpg, png, webp allowed.'));
};

const getMissingS3Env = () => {
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_UPLOADS_BUCKET',
  ];

  return required.filter((key) => !process.env[key]);
};

const getS3Client = () => new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file) => {
  const missing = getMissingS3Env();
  if (missing.length > 0) {
    throw new Error(`Missing S3 configuration: ${missing.join(', ')}`);
  }

  const ext      = path.extname(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await getS3Client().send(new PutObjectCommand({
    Bucket: process.env.S3_UPLOADS_BUCKET,
    Key: `uploads/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  return `https://${process.env.S3_UPLOADS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
};

const resolveS3Object = (value) => {
  if (!value) {
    throw new Error('Missing image source.');
  }

  const text = String(value).trim();
  if (!text) {
    throw new Error('Missing image source.');
  }

  if (text.startsWith('/uploads/') || text.startsWith('uploads/')) {
    const key = text.replace(/^\/+/, '');
    return { bucket: process.env.S3_UPLOADS_BUCKET, key };
  }

  if (/^https?:\/\//i.test(text)) {
    const parsed = new URL(text);
    const key = parsed.pathname.replace(/^\/+/, '');
    const hostMatch = parsed.hostname.match(/^(.+?)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i);
    const bucket = hostMatch ? hostMatch[1] : process.env.S3_UPLOADS_BUCKET;

    if (!bucket || !key) {
      throw new Error('Invalid S3 image URL.');
    }

    return { bucket, key };
  }

  return { bucket: process.env.S3_UPLOADS_BUCKET, key: text.replace(/^\/+/, '') };
};

module.exports = {
  multer: multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }),
  uploadToS3,
  getS3Client,
  getMissingS3Env,
  resolveS3Object,
};
