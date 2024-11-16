import { useState, useEffect } from 'react';
import { CategoryGrid } from '../components/CategoryGrid';
import { SearchHeader } from '../components/SearchHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useSearchParams, useLocation } from 'react-router-dom';
import { fetchCategories } from '../api/categories';
import { useMerchants } from '../contexts/MerchantContext';
import { useFilters } from '../contexts/FilterContext';
import { VALID_CATEGORIES } from '../constants/categories';

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
  const location = useLocation();

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';

  useEffect(() => {
    loadCategories();
  }, [searchParams, filters]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await fetchCategories({
        q: searchTerm,
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
        onSortChange={(sort) => {
          const [sortBy, sortOrder] = sort.split('-');
          updateFilters({ sortBy, sortOrder });
        }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        viewMode={filters.viewMode}
        setViewMode={(mode) => updateFilters({ viewMode: mode })}
      />
      
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
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
        onApplyFilters={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default Search;