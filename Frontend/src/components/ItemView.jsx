import { X } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../utils/priceUtils';
import { env } from '../config/environment';

export const ItemView = ({ item, category, onClose }) => {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleImageClick = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 shadow-xl">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 z-10 bg-white">
          <h3 className="text-xl font-semibold">{item.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="flex gap-8 p-6">
              <div className="w-1/2">
                <div className="relative cursor-zoom-in" onClick={handleImageClick}>
                  <img
                    src={item.cutout_image_url}
                    alt={item.name}
                    className="w-full object-contain"
                  />
                </div>
              </div>
              
              <div className="w-1/2">
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(item)}
                  </p>
                  {item.discount && (
                    <p className="text-red-600 font-medium mt-1">
                      Save {item.discount}%
                    </p>
                  )}
                </div>
                
                {(item.valid_from || item.valid_to) && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      {item.valid_from && `Valid from ${formatDate(item.valid_from)}`}
                      {item.valid_from && item.valid_to && ' to '}
                      {item.valid_to && formatDate(item.valid_to)}
                    </p>
                  </div>
                )}
                
                {item.sale_story && (
                  <div className="mb-4 p-2 bg-red-50 rounded-md">
                    <p className="text-sm text-red-600">{item.sale_story}</p>
                  </div>
                )}
                
                {item.brand && (
                  <p className="text-gray-600 mb-2">Brand: {item.brand}</p>
                )}
                
                {item.description && (
                  <p className="text-gray-700 mb-4">{item.description}</p>
                )}
                
                {item.merchant && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Merchant</h4>
                    <div className="flex items-center gap-2">
                      {!env.NO_EXTERNAL && !env.NO_MERCHANT_IMAGES && item.merchant.logo_url && (
                        <img
                          src={item.merchant.logo_url}
                          alt={item.merchant.name || 'Merchant'}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span>{item.merchant.name || 'Unknown Merchant'}</span>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">Category</h4>
                  <p className="text-sm text-gray-600">{category.cat}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isImageExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
          onClick={() => setIsImageExpanded(false)}
        >
          <img
            src={item.cutout_image_url}
            alt={item.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}; 