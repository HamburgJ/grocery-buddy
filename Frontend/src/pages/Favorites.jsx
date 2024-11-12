import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { CategoryGrid } from '../components/CategoryGrid';
import { useState, useEffect } from 'react';
import { fetchFavoriteCategories } from '../api/categories';

const Favorites = () => {
  const { favorites } = useFavorites();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (favorites.length === 0) {
        setCategories([]);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchFavoriteCategories(favorites);
        setCategories(result);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [favorites]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          No Favorites Yet
        </h2>
        <p className="text-gray-600 mb-8">
          Start adding items to your favorites to track them here!
        </p>
        <Link
          to="/search"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Browse Categories
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Favorites</h1>
        <p className="text-gray-600 mt-2">
          Track your favorite categories and never miss a deal
        </p>
      </header>
      
      <CategoryGrid categories={categories} />
    </div>
  );
};

export default Favorites;