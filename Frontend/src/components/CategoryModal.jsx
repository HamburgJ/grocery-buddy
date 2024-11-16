import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatPrice } from '../utils/priceUtils';

export const CategoryModal = ({ category, isOpen, onClose }) => {
  const [sortConfig, setSortConfig] = useState({ field: 'price', direction: 'asc' });
  const [selectedItem, setSelectedItem] = useState(null);
  
  const bestPrice = Math.min(...category.canonicalItems.map(i => i.originalItem.current_price));

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      const aValue = a.originalItem[sortConfig.field];
      const bValue = b.originalItem[sortConfig.field];
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 shadow-xl">
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="flex items-center gap-2">
            <select
              value={`${sortConfig.field}-${sortConfig.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortConfig({ field, direction });
              }}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="current_price-asc">Current Price: Low to High</option>
              <option value="current_price-desc">Current Price: High to Low</option>
            </select>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Image</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Price</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Merchant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortItems(category.canonicalItems).map(item => {
                  const isLowestPrice = item.originalItem.current_price === bestPrice;
                  return (
                    <tr 
                      key={item.item_id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        isLowestPrice ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="px-2 py-2">
                        <img
                          src={item.originalItem.cutout_image_url}
                          alt={item.originalItem.name}
                          className="w-10 h-10 object-contain"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <p className={`font-medium text-sm ${
                          isLowestPrice ? 'text-green-700' : 'text-gray-900'
                        }`}>
                          {item.originalItem.name}
                        </p>
                        {item.originalItem.description && (
                          <p className="text-xs text-gray-500">{item.originalItem.description}</p>
                        )}
                        {item.originalItem.brand && (
                          <p className="text-xs text-gray-400">{item.originalItem.brand}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className={`font-medium ${
                          isLowestPrice ? 'text-green-700' : 'text-gray-900'
                        }`}>
                          {formatPrice(item.originalItem)}
                        </p>
                        {item.originalItem.price !== item.originalItem.current_price && (
                          <p className="text-sm text-gray-500 line-through">
                            ${item.originalItem.price}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {item.originalItem.merchant?.logo_url && (
                            <img
                              src={item.originalItem.merchant.logo_url}
                              alt={item.originalItem.merchant.name}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {item.originalItem.merchant?.name}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}; 