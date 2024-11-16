import { createContext, useState, useContext, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';
import { VALID_CATEGORIES } from '../constants/categories';

const FilterContext = createContext();

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(() => {
    const savedFilters = getItem('filters');
    return savedFilters || {
      sortBy: 'interest',
      sortOrder: 'desc',
      categories: VALID_CATEGORIES,
      viewMode: 'grid',
      merchants: []
    };
  });

  const initializeMerchants = (merchantIds) => {
    if (!filters.merchants || filters.merchants.length === 0) {
      setFilters(prev => ({
        ...prev,
        merchants: merchantIds.map(id => id.toString())
      }));
    }
  };

  useEffect(() => {
    setItem('filters', filters);
  }, [filters]);

  return (
    <FilterContext.Provider value={{ 
      filters, 
      updateFilters: (newFilters) => setFilters(prev => ({ ...prev, ...newFilters })),
      initializeMerchants
    }}>
      {children}
    </FilterContext.Provider>
  );
}; 