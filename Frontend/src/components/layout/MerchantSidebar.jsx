import { useMerchants } from '../../contexts/MerchantContext';
import { useFilters } from '../../contexts/FilterContext';

export const MerchantSidebar = () => {
  const { merchants } = useMerchants();
  const { filters, updateFilters } = useFilters();
  
  const handleToggleMerchant = (merchantId) => {
    const merchantIdStr = merchantId.toString();
    const newMerchants = filters.merchants.includes(merchantIdStr)
      ? filters.merchants.filter(id => id !== merchantIdStr)
      : [...filters.merchants, merchantIdStr];
    
    if (newMerchants.length === 0) return;
    console.log('Updating merchants to:', newMerchants);
    updateFilters({ merchants: newMerchants });
  };

  return (
    <div className="w-64 bg-white shadow-md p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Selected Stores</h3>
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {merchants.map(merchant => (
          <label key={merchant.merchant_id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.merchants.includes(merchant.merchant_id.toString())}
              onChange={() => handleToggleMerchant(merchant.merchant_id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex items-center gap-2">
              <img
                src={merchant.logo_url}
                alt=""
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm text-gray-700">{merchant.name}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}; 