const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only jpg, png, webp allowed.'));
};

const uploadToS3 = async (file) => {
  const ext      = path.extname(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_UPLOADS_BUCKET,
    Key: `uploads/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  return `https://${process.env.S3_UPLOADS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
};

module.exports = { multer: multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }), uploadToS3 };