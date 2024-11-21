import { useState, useEffect } from 'react';
import { Star, StarOff, ChevronDown, ChevronRight } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { CategoryModal } from './CategoryModal';
import { formatPrice } from '../utils/priceUtils';
import { env } from '../config/environment';

export const ListCard = ({ category, isExpanded }) => {
  const [expanded, setExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.includes(category._id);
  
  const mainItem = category.canonicalItems[0].originalItem;
  const bestPrice = Math.min(...category.canonicalItems.map(i => i.price));
  const worstPrice = Math.max(...category.canonicalItems.map(i => i.price));
  
  const sortedItems = [...category.canonicalItems].sort((a, b) => 
    a.price - b.price
  );

  const displayItems = sortedItems.slice(0, 5);
  const hasMoreItems = category.canonicalItems.length > 5;
  const bestPriceItem = sortedItems[0].originalItem;
  
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);
  
  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-gray-50 border-t border-gray-100 cursor-pointer"
      >
        <td className="py-1.5 px-1 w-10">
          <div className={`transform transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
            <ChevronRight size={14} />
          </div>
        </td>
        {!env.NO_EXTERNAL && (
          <td className="py-1.5 px-1 w-16">
            <div className="relative w-14 h-14">
              <img
                src={mainItem.cutout_image_url}
                alt={mainItem.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </td>
        )}
        <td className="py-1.5 px-1 text-right whitespace-nowrap w-24">
          <div className="text-sm font-medium text-green-600">{formatPrice(bestPriceItem)}</div>
          {bestPrice !== worstPrice && (
            <div className="text-xs text-gray-500">to {formatPrice(sortedItems[sortedItems.length-1].originalItem)}</div>
          )}
        </td>
        <td className="py-1.5 px-1 min-w-[200px]">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-semibold text-gray-900">{category.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(category._id);
              }}
              className="p-0.5 hover:bg-gray-100 rounded-full"
            >
              {isFavorite ? (
                <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
              ) : (
                <StarOff className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">{category.canonicalItems.length} items</p>
        </td>
        <td className="py-1.5 px-1 w-[300px]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">Best price at:</span>
            {!env.NO_MERCHANT_IMAGES && bestPriceItem.merchant?.logo_url ? (
              <img
                src={bestPriceItem.merchant.logo_url}
                alt={bestPriceItem.merchant.name}
                className="w-32 h-4 object-contain"
              />
            ) : (
              <span className="text-xs text-gray-700">{bestPriceItem.merchant?.name}</span>
            )}
          </div>
        </td>
      </tr>
      
      <tr>
        <td colSpan="5" className="p-0">
          <div className={`transition-all duration-200 overflow-hidden ${expanded ? 'max-h-[500px]' : 'max-h-0'}`}>
            <table className="w-full">
              <tbody>
                {displayItems.map(item => {
                  const isLowestPrice = item.price === bestPrice;
                  return (
                    <tr 
                      key={item.originalItem.item_id}
                      className={`hover:bg-gray-50/30 cursor-pointer text-[11px] leading-tight ${
                        isLowestPrice ? 'bg-green-50' : ''
                      }`}
                      onClick={() => setIsModalOpen(true)}
                    >
                      <td className="w-10"></td>
                      <td className="w-16"></td>
                      <td className="py-0.5 px-1 text-right whitespace-nowrap w-24">
                        <div className={`${isLowestPrice ? 'text-green-700 font-medium' : 'text-gray-900'}`}>
                          {formatPrice(item.originalItem)}
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className={`${isLowestPrice ? 'text-green-700' : 'text-gray-900'}`}>
                          {item.originalItem.name}
                        </div>
                      </td>
                      <td className="py-0.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 truncate">
                            {item.originalItem.merchant?.name}
                          </span>
                          {!env.NO_MERCHANT_IMAGES && item.originalItem.merchant?.logo_url && (
                            <img
                              src={item.originalItem.merchant.logo_url}
                              alt={item.originalItem.merchant.name}
                              className="w-32 h-3 object-contain"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </td>
      </tr>

      <CategoryModal 
        category={category}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}; 