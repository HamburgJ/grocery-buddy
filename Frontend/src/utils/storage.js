import { env } from '../config/environment';

const getStorageType = () => {
  return env.STORAGE_TYPE === 'localStorage' ? localStorage : sessionStorage;
};

export const getItem = (key) => {
  try {
    const item = getStorageType().getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    if (env.ENABLE_LOGGING) {
      console.error('Storage Error:', error);
    }
    return null;
  }
};

export const setItem = (key, value) => {
  try {
    getStorageType().setItem(key, JSON.stringify(value));
  } catch (error) {
    if (env.ENABLE_LOGGING) {
      console.error('Storage Error:', error);
    }
  }
};

export const removeItem = (key) => {
  try {
    getStorageType().removeItem(key);
  } catch (error) {
    if (env.ENABLE_LOGGING) {
      console.error('Storage Error:', error);
    }
  }
}; 