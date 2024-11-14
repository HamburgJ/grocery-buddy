import { useState, useEffect } from 'react';
import { CategoryGrid } from '../components/CategoryGrid';
import { SearchHeader } from '../components/SearchHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useSearchParams } from 'react-router-dom';
import { fetchCategories } from '../api/categories';
import { useMerchants } from '../contexts/MerchantContext';

const ITEMS_PER_PAGE = 15;

const Search = () => {
  const { merchants } = useMerchants();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  const selectedMerchants = searchParams.get('merchants')?.split(',') || [];

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('q') || '';
  const selectedCategories = searchParams.get('categories')?.split(',') || [];
  const sortBy = searchParams.get('sortBy') || 'interest';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  useEffect(() => {
    loadCategories();
  }, [searchParams]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await fetchCategories({
        q: searchTerm,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        categories: selectedCategories,
        sortBy,
        sortOrder
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
    
    updateSearch({ 
      ...Object.fromEntries(searchParams.entries()),
      page: page.toString() 
    });
  };

  const updateSearch = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto px-4">
      <SearchHeader
        searchTerm={searchTerm}
        onSearch={(term) => updateSearch({ q: term, page: '1' })}
        onSortChange={(sort) => updateSearch({ 
          sortBy: sort.split('-')[0],
          sortOrder: sort.split('-')[1],
          page: '1'
        })}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
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
          viewMode={viewMode}
        />
      )}
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={metadata?.validCategories || []}
        selectedCategories={selectedCategories}
        merchants={merchants}
        selectedMerchants={selectedMerchants}
        onCategoryChange={(category) => {
          const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];
          updateSearch({ 
            categories: newCategories.join(','),
            page: '1'
          });
        }}
        onMerchantChange={(merchantId) => {
          const newMerchants = selectedMerchants.includes(merchantId)
            ? selectedMerchants.filter(id => id !== merchantId)
            : [...selectedMerchants, merchantId];
          updateSearch({
            merchants: newMerchants.join(','),
            page: '1'
          });
        }}
        onApplyFilters={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default Search;