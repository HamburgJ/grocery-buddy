const config = {
  development: {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-dev',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    LOG_LEVEL: 'debug'
  },
  test: {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-test',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    LOG_LEVEL: 'error'
  },
  production: {
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    LOG_LEVEL: 'error'
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment]; 