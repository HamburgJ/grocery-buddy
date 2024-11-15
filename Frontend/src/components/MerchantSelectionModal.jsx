import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useMerchants } from '../contexts/MerchantContext';
import { env } from '../config/environment';

export const MerchantSelectionModal = ({ onComplete }) => {
  const { setSelectedMerchants } = useMerchants();
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantIds, setSelectedMerchantIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const loadMerchants = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${env.API_URL}/merchants/`);
        const data = await response.json();
        setMerchants(data);
        setSelectedMerchantIds(data.map(m => m._id));
      } catch (error) {
        setError('Failed to load merchants');
      } finally {
        setLoading(false);
      }
    };
    loadMerchants();
  }, []);

  const handleSubmit = () => {
    if (selectedMerchantIds.length === 0) {
      setError('Please select at least one merchant');
      return;
    }
    
    setSelectedMerchants(selectedMerchantIds);
    onComplete();
  };

  const handleSelectAllAndClose = () => {
    setSelectedMerchants(merchants.map(m => m._id));
    onComplete();
  };

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleSelectAllAndClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [merchants]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full p-8 relative">
        <button
          onClick={handleSelectAllAndClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={24} className="text-gray-500" />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Select Your Merchants</h2>
        
        {/* Merchant Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
          {merchants.map(merchant => (
            <label
              key={merchant._id}
              className={`
                flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                ${selectedMerchantIds.includes(merchant._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              `}
            >
              <input
                type="checkbox"
                checked={selectedMerchantIds.includes(merchant._id)}
                onChange={() => {
                  setSelectedMerchantIds(prev =>
                    prev.includes(merchant._id)
                      ? prev.filter(id => id !== merchant._id)
                      : [...prev, merchant._id]
                  );
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1 flex justify-center">
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-16 h-16 object-contain"
                  style={{ userSelect: 'none' }}
                />
              </div>
            </label>
          ))}
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};