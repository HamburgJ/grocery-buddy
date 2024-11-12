import { SlidersHorizontal, X } from 'lucide-react';

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  categories, 
  selectedCategories, 
  onCategoryChange,
  onApplyFilters 
}) => {
  return (
    <div className={`
      fixed inset-y-0 right-0 w-72 bg-white shadow-lg transform transition-transform duration-300
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-3">Categories</h4>
          {categories?.map(category => (
            <label key={category} className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => onCategoryChange(category)}
                className="rounded text-blue-600"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
        
        <button
          onClick={onApplyFilters}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};