import { useState } from 'react';
import { Search as SearchIcon, SlidersHorizontal, LayoutGrid, Grid, List } from 'lucide-react';

export const SearchHeader = ({ 
  searchTerm, 
  onSearch, 
  onSortChange, 
  onFilterClick,
  sidebarOpen,
  setSidebarOpen,
  viewMode,
  setViewMode
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const viewModes = [
    {
      value: 'grid',
      label: 'Grid View',
      icon: <LayoutGrid size={16} />
    },
    {
      value: 'list',
      label: 'List View',
      icon: <List size={16} />
    }
  ];

  return (
    <div className="mb-8">
      <div className="mb-6">
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
      </div>
      
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <select
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="interest-desc">Most Popular</option>
            <option value="interest-asc">Least Popular</option>
            <option value="value-desc">Best Value</option>
            <option value="value-asc">Lower Value</option>
          </select>
          
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {viewModes.map(mode => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`p-2 ${
                  viewMode === mode.value 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>
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