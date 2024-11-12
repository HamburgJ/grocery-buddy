import { useState, useEffect } from 'react';
import { CategoryGrid } from '../components/CategoryGrid';
import { SearchHeader } from '../components/SearchHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useSearchParams } from 'react-router-dom';
import { fetchCategories } from '../api/categories';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
        searchTerm,
        page: currentPage,
        categories: selectedCategories,
        sortBy,
        sortOrder
      });
      setCategories(result.data);
      setMetadata(result.metadata);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
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
    <div className="relative">
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
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : (
        <CategoryGrid 
          categories={categories}
          onPageChange={(page) => updateSearch({ page: page.toString() })}
          metadata={metadata}
        />
      )}
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={metadata?.validCategories || []}
        selectedCategories={selectedCategories}
        onCategoryChange={(category) => {
          const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];
          updateSearch({ 
            categories: newCategories.join(','),
            page: '1'
          });
        }}
        onApplyFilters={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default Search;