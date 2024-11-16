import { useState } from 'react';

const cache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

export const useCache = () => {
  const getCached = (key) => {
    const cached = cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  };

  const setCache = (key, data) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  return { getCached, setCache };
}; 