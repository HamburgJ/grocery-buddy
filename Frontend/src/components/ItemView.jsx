import { X } from 'lucide-react';
import { useState } from 'react';

export const ItemView = ({ item, category, onClose }) => {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const handleImageClick = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">{item.name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-6 mb-6">
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
                  ${parseFloat(item.current_price).toFixed(2)}
                </p>
                {item.price !== item.current_price && (
                  <p className="text-gray-500 line-through">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                )}
              </div>
              
              {item.brand && (
                <p className="text-gray-600 mb-2">Brand: {item.brand}</p>
              )}
              
              {item.description && (
                <p className="text-gray-700 mb-4">{item.description}</p>
              )}
              
              {item.sale_story && (
                <p className="text-red-600 mb-4">{item.sale_story}</p>
              )}
              
              {item.merchant && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Merchant Information</h4>
                  <div className="flex items-center gap-2">
                    {item.merchant.logo_url && (
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
                <p>{category.name}</p>
                <p className="text-sm text-gray-600">{category.cat}</p>
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