import { useState, useEffect } from 'react';
import { Search as SearchIcon, SlidersHorizontal, LayoutGrid, Grid, List } from 'lucide-react';
import { useFilters } from '../contexts/FilterContext';
import { env } from "../config/environment";

export const SearchHeader = ({ 
  searchTerm, 
  onSearch,
  hideSearch,
  sidebarOpen,
  setSidebarOpen
}) => {
  const { filters, updateFilters } = useFilters();
  const [inputValue, setInputValue] = useState(searchTerm);

  // Force list view when NO_EXTERNAL is true
  useEffect(() => {
    if (env.NO_EXTERNAL) {
      updateFilters({ viewMode: 'list' });
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleViewModeChange = (viewMode) => {
    updateFilters({ viewMode });
  };

  return (
    <div className="mb-8">
      <div className="mb-6">
        {!hideSearch && (
          <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search for categories..."
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <SearchIcon size={20} />
            </button>
          </form>
        )}
      </div>
      
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          {!env.NO_EXTERNAL && (
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 ${
                  filters.viewMode === 'grid' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 ${
                  filters.viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>
    </div>
  );
};