const environments = {
  development: {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
    STORAGE_TYPE: import.meta.env.VITE_STORAGE_TYPE || 'localStorage',
    ENABLE_DEBUG: true
  },
  production: {
    API_URL: import.meta.env.VITE_API_URL,
    ENABLE_LOGGING: false,
    STORAGE_TYPE: 'localStorage',
    ENABLE_DEBUG: false
  }
};

const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return (import.meta.env.VITE_API_URL || environments.production.API_URL).replace(/\/$/, '');
  }
  return environments.development.API_URL;
};

export const env = {
  ...environments[import.meta.env.MODE || 'development'],
  API_URL: getApiUrl()
}; 