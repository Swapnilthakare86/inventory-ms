const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Security headers
app.use(helmet());

// Restrict CORS to frontend only
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

app.use(express.json());

// Morgan — console in dev, file in production
if (process.env.NODE_ENV === 'production') {
  const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: logStream }));
} else {
  app.use(morgan('dev'));
}

// Rate limit on auth routes — max 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests. Please try again after 15 minutes.' },
});

// Serve uploaded product images — allow cross-origin so frontend can load them
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authLimiter);
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/categories',require('./routes/categories'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/upload',    require('./routes/upload'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Node Backend' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} —`, err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
