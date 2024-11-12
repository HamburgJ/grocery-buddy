const configs = {
  development: {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === 'true',
    STORAGE_TYPE: process.env.REACT_APP_STORAGE_TYPE || 'memory',
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL,
    ENABLE_LOGGING: false,
    STORAGE_TYPE: 'localStorage',
  }
};

const environment = process.env.NODE_ENV || 'development';
export const config = configs[environment]; 