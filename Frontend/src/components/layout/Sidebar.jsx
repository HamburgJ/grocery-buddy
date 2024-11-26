import { SlidersHorizontal, X } from 'lucide-react';
import { useMerchants } from '../../contexts/MerchantContext';
import { useFilters } from '../../contexts/FilterContext';
import { getMerchantDisplay } from '../../utils/imageUtils';
import { env } from '../../config/environment';

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  categories,
  onApplyFilters,
  showMerchantFilters = true
}) => {
  const { merchants } = useMerchants();
  const { filters, updateFilters } = useFilters();

  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const handleToggleMerchant = (merchantId) => {
    const merchantIdStr = merchantId.toString();
    const newMerchants = filters.merchants.includes(merchantIdStr)
      ? filters.merchants.filter(id => id !== merchantIdStr)
      : [...filters.merchants, merchantIdStr];
    
    if (newMerchants.length === 0) return;
    updateFilters({ merchants: newMerchants });
  };

  return (
    <div className={`
      fixed inset-y-0 right-0 w-72 bg-white shadow-lg transform transition-transform duration-300 z-[60]
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">Categories</h4>
          <div className="space-y-2">
            {categories?.map(category => (
              <label key={category} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {showMerchantFilters && (
          <div className="flex-1 overflow-y-auto">
            <div className="xl:hidden mb-6">
              <h4 className="text-lg font-medium mb-4">Selected Stores</h4>
              <div className="space-y-2">
                {merchants.map(merchant => (
                  <label key={merchant.merchant_id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.merchants.includes(merchant.merchant_id.toString())}
                      onChange={() => handleToggleMerchant(merchant.merchant_id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center gap-2">
                      {env.NO_EXTERNAL ? (
                        <span className="text-sm text-gray-700">{merchant.name}</span>
                      ) : (
                        <>
                          {!env.NO_MERCHANT_IMAGES && merchant.logo_url && (
                            <img
                              src={merchant.logo_url}
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <span className="text-sm text-gray-700">{merchant.name}</span>
                        </>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onApplyFilters}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-4"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};