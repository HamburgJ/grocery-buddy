import { useState, useEffect } from 'react';
import { CategoryGrid } from '../components/CategoryGrid';
import { SearchHeader } from '../components/SearchHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useSearchParams, useLocation } from 'react-router-dom';
import { fetchCategories } from '../api/categories';
import { useMerchants } from '../contexts/MerchantContext';
import { useFilters } from '../contexts/FilterContext';
import { VALID_CATEGORIES } from '../constants/categories';
import { env } from '../config/environment';

const ITEMS_PER_PAGE = 15;

const Search = () => {
  const { merchants } = useMerchants();
  const { filters, updateFilters } = useFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(null);
  const location = useLocation();

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';

  useEffect(() => {
    if (pendingFilters) {
      loadCategories();
      setPendingFilters(null);
    }
  }, [pendingFilters]);

  useEffect(() => {
    loadCategories();
  }, [searchParams, filters]);

  useEffect(() => {
    if (env.NO_EXTERNAL) {
      updateFilters({ viewMode: 'list' });
    }
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await fetchCategories({
        q: searchTerm,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        categories: filters.categories,
        merchantIds: filters.merchants.join(','),
        sortBy: 'interest',
        sortOrder: 'desc'
      });
      
      setCategories(result.data);
      setMetadata({
        ...result.metadata,
        currentPage,
        totalPages: Math.ceil(result.metadata.totalCount / ITEMS_PER_PAGE)
      });
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
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

  const handleApplyFilters = () => {
    setPendingFilters(filters);
    setSidebarOpen(false);
  };

  console.log('categories', categories);
  return (
    <div className="container mx-auto px-4">
      <SearchHeader
        searchTerm={searchTerm}
        onSearch={(term) => {
          const newParams = new URLSearchParams(searchParams);
          if (term) {
            newParams.set('q', term);
          } else {
            newParams.delete('q');
          }
          newParams.set('page', '1');
          setSearchParams(newParams);
        }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        viewMode={filters.viewMode}
        setViewMode={(mode) => updateFilters({ viewMode: mode })}
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            No Results Found
          </h2>
          <p className="text-gray-600 mb-6">
            {searchTerm ? (
              <>
                No items found for "<span className="font-medium">{searchTerm}</span>"
                {filters.categories.length > 0 && " in the selected categories"}
                {filters.merchants.length > 0 && " at the selected stores"}
              </>
            ) : (
              "Try adjusting your filters or search terms"
            )}
          </p>
          {(filters.categories.length > 0 || filters.merchants.length > 0) && (
            <button
              onClick={() => {
                updateFilters({ categories: [], merchants: [] });
                setSidebarOpen(false);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
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
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={metadata?.validCategories || []}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default Search;