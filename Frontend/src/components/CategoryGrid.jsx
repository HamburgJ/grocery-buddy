import { CategoryCard } from './CategoryCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CategoryGrid = ({ 
  categories, 
  onPageChange,
  metadata 
}) => {
  const showPagination = metadata && metadata.totalPages > 1;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {categories.map(category => (
          <CategoryCard key={category._id} category={category} />
        ))}
      </div>
      
      {showPagination && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => onPageChange(metadata.currentPage - 1)}
            disabled={metadata.currentPage === 1}
            className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm text-gray-600">
            Page {metadata.currentPage} of {metadata.totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(metadata.currentPage + 1)}
            disabled={!metadata.hasNextPage}
            className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};