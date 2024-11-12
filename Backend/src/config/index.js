const environment = process.env.NODE_ENV || 'development';
console.log('Environment:', environment);
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('CORS Origins:', process.env.CORS_ORIGINS);

const config = {
  development: {
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-dev',
    CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    LOG_LEVEL: 'debug'
  },
  test: {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-test',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    LOG_LEVEL: 'error'
  },
  production: {
    PORT: process.env.PORT || 3001,
    MONGODB_URI: process.env.MONGODB_URI,
    CORS_ORIGINS: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['https://your-frontend-domain.com'],
    LOG_LEVEL: 'error'
  }
};

module.exports = config[environment]; 