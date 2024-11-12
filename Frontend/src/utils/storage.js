import { config } from '../config';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, value);
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const memoryStorage = new MemoryStorage();

export const storage = {
  getItem: (key) => {
    return config.STORAGE_TYPE === 'localStorage' 
      ? localStorage.getItem(key)
      : memoryStorage.getItem(key);
  },
  
  setItem: (key, value) => {
    return config.STORAGE_TYPE === 'localStorage'
      ? localStorage.setItem(key, value)
      : memoryStorage.setItem(key, value);
  },
  
  removeItem: (key) => {
    return config.STORAGE_TYPE === 'localStorage'
      ? localStorage.removeItem(key)
      : memoryStorage.removeItem(key);
  },
  
  clear: () => {
    return config.STORAGE_TYPE === 'localStorage'
      ? localStorage.clear()
      : memoryStorage.clear();
  }
}; 