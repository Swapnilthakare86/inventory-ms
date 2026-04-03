const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',require('./routes/auth'));
app.use('/api/products',require('./routes/products'));
app.use('/api/categories',require('./routes/categories'));
app.use('/api/suppliers',require('./routes/suppliers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Node Backend' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));