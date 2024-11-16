import { useState, useEffect } from 'react';
import { Star, StarOff, X } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { ItemView } from './ItemView';
import { formatPrice } from '../utils/priceUtils';

export const CategoryCard = ({ category }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'price', direction: 'asc' });
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.includes(category._id);

  // Filter out items without originalItem first
  const validItems = category.canonicalItems.filter(item => item.originalItem);
  console.log('category', category);
  
  // Only proceed with sorting if we have valid items
  if (validItems.length === 0) {
    return null; // or return some placeholder/error state
  }
  
  // Sort items by price before getting mainItem and secondaryItems
  const sortedItems = [...validItems].sort((a, b) => 
    a.originalItem.price - b.originalItem.price
  );
  
  const mainItem = sortedItems[0].originalItem;
  const secondaryItems = sortedItems.map(item => item.originalItem);
  
  // Update price calculations to use validItems
  const sortedPrices = [...new Set(validItems.map(i => i.originalItem.price))].sort((a, b) => a - b);
  const bestPrice = sortedPrices[0];
  const worstPrice = sortedPrices[sortedPrices.length - 1];
  const bestDeals = validItems
    .filter(i => i.originalItem.price === bestPrice)
    .map(i => i.originalItem)
    .filter((item, index, self) => 
      index === self.findIndex(t => t.merchant.name === item.merchant.name)
    );

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

  const sortItems = (items) => {
    return [...items].filter(item => item.originalItem).sort((a, b) => {
      const aValue = a.originalItem[sortConfig.field];
      const bValue = b.originalItem[sortConfig.field];
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

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
                  <span className="text-sm font-bold text-green-700">{formatPrice(bestDeals[0])}</span>
                  <span className="text-xs text-green-600 ml-1">
                    at {bestDeals.map(d => d.merchant.name).join(' or ')}
                  </span>
                </div>
                
                {bestPrice !== worstPrice && (
                  <p className="text-xs text-gray-600 mt-1">
                    Other prices: {formatPrice(validItems.find(i => i.originalItem.price === sortedPrices[1])?.originalItem)} - {formatPrice(validItems.find(i => i.originalItem.price === worstPrice)?.originalItem)}
                  </p>
                )}
              </div>
            </div>

            {/* Item count */}
            <p className="text-xs text-gray-500">
              {validItems.length} items available
            </p>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 group-hover:backdrop-blur-[2px] flex items-center justify-center transition-all rounded-lg">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-900 font-medium bg-white/90 px-4 py-2 rounded-lg shadow-sm">
            Compare {validItems.length} Items →
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
              <div>
                <h3 className="text-xl font-semibold">
                  {category.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </h3>
                <div className="mt-1">
                  <div className="inline-block bg-green-50 px-1.5 py-0.5 rounded">
                    <span className="text-sm font-bold text-green-700">{formatPrice(bestDeals[0])}</span>
                    <span className="text-xs text-green-600 ml-1">
                      at {bestDeals.map(d => d.merchant.name).join(' or ')}
                    </span>
                  </div>
                </div>
              </div>
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
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
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
                  {sortItems(validItems).map(item => {
                    const isLowestPrice = item.originalItem.current_price === bestPrice;
                    return (
                      <tr 
                        key={item.item_id}
                        onClick={() => setSelectedItem(item.originalItem)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          isLowestPrice ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-2 py-2">
                          <img
                            src={item.originalItem.cutout_image_url}
                            alt={item.originalItem.name}
                            className="w-10 h-10 object-contain cursor-zoom-in"
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
                          {item.originalItem.sale_story && (
                            <p className="text-xs text-red-600 mt-1">{item.originalItem.sale_story}</p>
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
                              {formatPrice(item.originalItem)}
                            </p>
                          )}
                          {item.originalItem.discount && (
                            <p className="text-xs text-red-600">Save {item.originalItem.discount}%</p>
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
