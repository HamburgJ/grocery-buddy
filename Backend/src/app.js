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

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    [config.CORS_ORIGIN],
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(config.MONGODB_URI)
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

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});