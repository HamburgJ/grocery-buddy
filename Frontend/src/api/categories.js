import { env } from '../config/environment';
import { cacheManager, CACHE_DURATION } from '../utils/cache';

export const fetchCategories = async ({
  q,
  page = 1,
  limit = 15,
  categories = [],
  merchantIds,
  sortBy = 'interest',
  sortOrder = 'desc'
}) => {
  const cacheKey = `categories-${q}-${page}-${limit}-${categories.join()}-${merchantIds}-${sortBy}-${sortOrder}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    ...(q && { q }),
    skip: ((page - 1) * limit).toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  
  if (categories.length > 0) {
    params.append('categories', categories.join(','));
  }
  
  if (merchantIds) {
    params.append('merchantIds', merchantIds);
  }
  
  const response = await fetch(`${env.API_URL}/canonicalCategories?${params}`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  
  cacheManager.set(cacheKey, data, CACHE_DURATION.CATEGORIES);
  return data;
};

export const fetchStaples = async (merchants = null) => {
  const cacheKey = `staples-${merchants?.join(',') || 'all'}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (merchants?.length) {
    params.append('merchants', merchants.join(','));
  }

  const url = `${env.API_URL}/staples${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch staples');
  const data = await response.json();

  cacheManager.set(cacheKey, data, CACHE_DURATION.STAPLES);
  return data;
};

export const fetchFavoriteCategories = async ({
  ids,
  page = 1,
  limit = 15,
  categories = [],
  merchantIds,
  sortBy = 'interest',
  sortOrder = 'desc'
}) => {
  const cacheKey = `favorites-${ids.join()}-${page}-${limit}-${categories.join()}-${merchantIds}-${sortBy}-${sortOrder}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    ids: ids.join(','),
    skip: ((page - 1) * limit).toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  
  if (categories.length > 0) {
    params.append('categories', categories.join(','));
  }
  
  if (merchantIds) {
    params.append('merchantIds', merchantIds);
  }

  const response = await fetch(`${env.API_URL}/canonicalCategories/ids?${params}`);
  if (!response.ok) throw new Error('Failed to fetch favorite categories');
  const data = await response.json();

  cacheManager.set(cacheKey, data, CACHE_DURATION.CATEGORIES);
  return data;
};