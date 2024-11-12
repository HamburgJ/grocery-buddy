import { useState, useEffect } from 'react';
import { Star, StarOff, X } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { ItemView } from './ItemView';

export const CategoryCard = ({ category }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.includes(category._id);

  const items = category.canonicalItems;
  const mainItem = items[0].originalItem;
  const secondaryItems = items.map(item => item.originalItem);
  
  // Use price field for sorting, but display current_price
  const sortedPrices = [...new Set(items.map(i => i.originalItem.price))].sort((a, b) => a - b);
  const bestPrice = sortedPrices[0];
  const worstPrice = sortedPrices[sortedPrices.length - 1];
  const bestDeals = items.filter(i => i.originalItem.price === bestPrice).map(i => i.originalItem);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative h-80">
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(category._id);
        }}
        className="absolute top-2 right-2 z-10 p-1.5 hover:bg-gray-100 rounded-full bg-white shadow-sm"
      >
        {isFavorite ? (
          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
        ) : (
          <StarOff className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Main card content */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="p-4 cursor-pointer group relative h-full"
      >
        <div className="flex gap-6 h-full">
          {/* Left side - Images */}
          <div className="w-1/2 min-w-[150px] relative flex flex-col">
            {/* Main image container */}
            <div className="flex items-center justify-center">
              <img
                src={mainItem.cutout_image_url}
                alt={mainItem.name}
                className="w-full max-h-40 object-contain"
              />
            </div>
            
            {/* Secondary images - with overflow handling */}
            <div className="grid grid-cols-2 gap-2 mt-2 overflow-hidden relative">
              {secondaryItems.map((item) => (
                <div key={item.item_id} className="aspect-square w-full">
                  <img
                    src={item.cutout_image_url}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right side - Info */}
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {category.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </h2>
              
              {/* Price information */}
              <div>
                <div className="inline-block bg-green-50 px-1.5 py-0.5 rounded">
                  <span className="text-sm font-bold text-green-700">${bestDeals[0].current_price}</span>
                  <span className="text-xs text-green-600 ml-1">
                    at {bestDeals.map(d => d.merchant.name).join(' or ')}
                  </span>
                </div>
                
                {bestPrice !== worstPrice && (
                  <p className="text-xs text-gray-600 mt-1">
                    Other prices: ${items.find(i => i.originalItem.price === sortedPrices[1])?.originalItem.current_price || bestDeals[0].current_price} - ${items.find(i => i.originalItem.price === worstPrice)?.originalItem.current_price}
                  </p>
                )}
              </div>
            </div>

            {/* Item count */}
            <p className="text-xs text-gray-500">
              {items.length} items available
            </p>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 group-hover:backdrop-blur-[2px] flex items-center justify-center transition-all rounded-lg">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-900 font-medium bg-white/90 px-4 py-2 rounded-lg shadow-sm">
            Compare {items.length} Items →
          </span>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h3 className="text-xl font-semibold">{category.name}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
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
                  {items.map(item => (
                    <tr 
                      key={item.item_id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-2 py-2">
                        <img
                          src={item.cutout_image_url}
                          alt={item.name}
                          className="w-10 h-10 object-contain cursor-zoom-in"
                          onClick={(e) => handleImageClick(e, item)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                        {item.brand && (
                          <p className="text-xs text-gray-400 mt-1">{item.brand}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-gray-900">
                          {item.originalItem.current_price}
                        </p>
                        {item.originalItem.price !== item.originalItem.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ${item.originalItem.price.toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {item.originalItem.merchant && item.originalItem.merchant.logo_url && (
                            <img
                              src={item.originalItem.merchant.logo_url}
                              alt={item.originalItem.merchant?.name || 'Merchant'}
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="text-sm text-gray-600">
                            {item.originalItem.merchant?.name || 'Unknown Merchant'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <ItemView
          item={selectedItem}
          category={category}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
