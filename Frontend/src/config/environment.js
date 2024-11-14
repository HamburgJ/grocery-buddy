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
    API_URL: import.meta.env.VITE_API_URL || 'https://your-production-api.com',
    GEOCODING_API_URL: import.meta.env.VITE_GEOCODING_API_URL || '/api/geocode',
    ENABLE_DEBUG: false
  }
};

export const env = environments[import.meta.env.MODE || 'development']; 