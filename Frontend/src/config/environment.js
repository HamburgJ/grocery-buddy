const environments = {
  development: {
    API_URL: 'http://localhost:3001',
    GEOCODING_API_URL: '/api/geocode',
    ENABLE_DEBUG: true
  },
  test: {
    API_URL: 'http://localhost:3001',
    GEOCODING_API_URL: '/api/geocode',
    ENABLE_DEBUG: true
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    GEOCODING_API_URL: process.env.REACT_APP_GEOCODING_API_URL || '/api/geocode',
    ENABLE_DEBUG: false
  }
};

export const env = environments[process.env.NODE_ENV || 'development']; 