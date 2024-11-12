import { config } from '../config';

const BASE_URL = config.API_URL;

export const fetchCategories = async ({
  searchTerm,
  page = 1,
  categories = [],
  sortBy = 'interest',
  sortOrder = 'desc'
}) => {
  const params = new URLSearchParams({
    ...(searchTerm && { q: searchTerm }),
    page: page.toString(),
    sortBy,
    sortOrder,
  });
  
  if (categories.length > 0) {
    params.append('categories', categories.join(','));
  }
  
  try {
    const response = await fetch(`${BASE_URL}/canonicalCategories?${params}`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  } catch (error) {
    if (config.ENABLE_LOGGING) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

export const fetchDeals = async () => {
  const response = await fetch(`${BASE_URL}/deals`);
  return response.json();
}; 

export const fetchFavoriteCategories = async (favoriteIds) => {
    const params = new URLSearchParams({
      ids: favoriteIds.join(',')
    });
    
    const response = await fetch(`${BASE_URL}/canonicalCategories/ids?${params}`);
    if (!response.ok) throw new Error('Failed to fetch favorite categories');
    return response.json();
  };