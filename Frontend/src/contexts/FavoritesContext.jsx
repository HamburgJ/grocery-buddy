import { createContext, useState, useContext, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = getItem('favorites');
    return saved || [];
  });

  useEffect(() => {
    setItem('favorites', favorites);
  }, [favorites]);

  const toggleFavorite = (categoryId) => {
    setFavorites(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}; 