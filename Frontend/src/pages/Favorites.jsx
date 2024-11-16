import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { CategoryGrid } from '../components/CategoryGrid';
import { SearchHeader } from '../components/SearchHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { fetchFavoriteCategories } from '../api/categories';
import { useMerchants } from '../contexts/MerchantContext';
import { VALID_CATEGORIES } from '../constants/categories';
import { useFilters } from '../contexts/FilterContext';

const ITEMS_PER_PAGE = 15;

const Favorites = () => {
  const { favorites } = useFavorites();
  const { merchants } = useMerchants();
  const { filters, updateFilters } = useFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    loadFavorites();
  }, [searchParams, favorites]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [location]);

  const loadFavorites = async () => {
    setLoading(true);
    if (favorites.length === 0) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const result = await fetchFavoriteCategories({
        ids: favorites,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        categories: filters.categories,
        merchantIds: filters.merchants.join(','),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      setCategories(result.data);
      setMetadata({
        ...result.metadata,
        currentPage,
        totalPages: Math.ceil(result.metadata.totalCount / ITEMS_PER_PAGE)
      });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > metadata?.totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Favorites</h1>
        <p className="text-gray-600 mt-2">
          Track your favorite categories and never miss a deal
        </p>
      </header>

      <div className="flex-1">
        {favorites.length > 0 && (
          <SearchHeader
            onSortChange={(sort) => updateFilters({ 
              sortBy: sort.split('-')[0],
              sortOrder: sort.split('-')[1],
              page: '1'
            })}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            viewMode={filters.viewMode}
            setViewMode={(mode) => updateFilters({ viewMode: mode })}
            hideSearch={true}
          />
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : favorites.length === 0 ? (
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
        ) : (
          <CategoryGrid 
            categories={categories}
            onPageChange={handlePageChange}
            metadata={{
              ...metadata,
              hasNextPage: currentPage < metadata?.totalPages
            }}
            viewMode={filters.viewMode}
          />
        )}
      </div>

      {favorites.length > 0 && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          categories={metadata?.validCategories || VALID_CATEGORIES}
          onApplyFilters={() => setSidebarOpen(false)}
          showMerchantFilters={true}
        />
      )}
    </div>
  );
};

export default Favorites;