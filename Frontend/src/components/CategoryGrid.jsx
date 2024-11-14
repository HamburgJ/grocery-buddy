import { CategoryCard } from './CategoryCard';
import { ListCard } from './ListCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export const CategoryGrid = ({ 
  categories, 
  onPageChange,
  metadata,
  viewMode
}) => {
  const [allExpanded, setAllExpanded] = useState(false);
  const showPagination = metadata && metadata.totalPages > 1;

  const getGridClassName = () => {
    return viewMode === 'list' 
      ? '' // No grid for list view
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4';
  };

  return (
    <div>
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-end p-2 bg-gray-50 border-b">
            <button
              onClick={() => setAllExpanded(!allExpanded)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
              <tr>
                <th className="py-2 px-2 w-8"></th>
                <th className="py-2 px-2 w-12">Image</th>
                <th className="py-2 px-2 w-24 text-right">Price</th>
                <th className="py-2 px-2 text-left">Item</th>
                <th className="py-2 px-2 text-left w-32">Merchants</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <ListCard 
                  key={category._id} 
                  category={category} 
                  isExpanded={allExpanded}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`grid ${getGridClassName()}`}>
          {categories.map(category => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      )}
      
      {showPagination && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => onPageChange(metadata.currentPage - 1)}
            disabled={metadata.currentPage === 1}
            className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm text-gray-600">
            Page {metadata.currentPage} of {metadata.totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(metadata.currentPage + 1)}
            disabled={metadata.currentPage === metadata.totalPages}
            className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};