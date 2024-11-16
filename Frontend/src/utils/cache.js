const CACHE_DURATION = {
  STAPLES: 24 * 60 * 60 * 1000,    // 24 hours
  CATEGORIES: 30 * 60 * 1000,      // 30 minutes
  MERCHANTS: 12 * 60 * 60 * 1000   // 12 hours
};

class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.duration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data, duration) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
export { CACHE_DURATION }; 