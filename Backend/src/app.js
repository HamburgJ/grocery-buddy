console.log('Starting application...');
console.log('Current directory:', process.cwd());
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '[REDACTED]' : 'not set',
  CORS_ORIGINS: process.env.CORS_ORIGINS
});

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const flyerRoutes = require('./routes/flyerRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const scraperRoutes = require('./routes/scraperRoutes');
const itemCategorizationRoutes = require('./routes/itemCategorizationRoutes');
const canonicalCategoryRoutes = require('./routes/canonicalCategoryRoutes');
const staplesRoutes = require('./routes/staplesRoutes'); // Add this line

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = config.CORS_ORIGINS;
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/flyers', flyerRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/scrapers', scraperRoutes);
app.use('/api/itemCategorizations', itemCategorizationRoutes);
app.use('/api/canonicalCategories', canonicalCategoryRoutes);
app.use('/api/staples', staplesRoutes); // Add this line

// Add after your other routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Grocery Buddy API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;