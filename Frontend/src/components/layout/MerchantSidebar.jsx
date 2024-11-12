import { useMerchants } from '../../contexts/MerchantContext';
import { useState, useEffect } from 'react';
import { config } from '../../config/index';

export const MerchantSidebar = () => {
  const { selectedMerchants, setSelectedMerchants } = useMerchants();
  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const response = await fetch(`${config.API_URL}/merchants/`);
        const data = await response.json();
        setMerchants(data);
      } catch (error) {
        console.error('Failed to load merchants');
      }
    };
    loadMerchants();
  }, []);

  const handleToggleMerchant = (merchantId) => {
    setSelectedMerchants(prev =>
      prev.includes(merchantId)
        ? prev.filter(id => id !== merchantId)
        : [...prev, merchantId]
    );
  };

  return (
    <div className="w-64 bg-white shadow-md p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Selected Stores</h3>
      <div className="space-y-2">
        {merchants.map(merchant => (
          <label key={merchant._id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMerchants?.includes(merchant._id)}
              onChange={() => handleToggleMerchant(merchant._id)}
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