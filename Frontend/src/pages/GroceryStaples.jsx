import { useState, useEffect } from 'react';
import { fetchCategories } from '../api/categories';

const GroceryStaples = () => {
  const [staples, setStaples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaples = async () => {
      try {
        // Fetch categories with specific IDs for staple items
        const result = await fetchCategories({
          categories: ['milk', 'bread', 'eggs', 'rice', 'pasta', 'potatoes', 'onions', 'chicken', 'bananas', 'carrots'],
          sortBy: 'interest',
          sortOrder: 'desc'
        });
        setStaples(result.data);
      } catch (error) {
        console.error('Failed to load staples:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStaples();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-logo font-bold text-gray-900 mb-4">
          Top 10 Canadian Grocery Staples
        </h1>
        <p className="text-xl font-body text-gray-600 max-w-2xl mx-auto">
          Track the prices of essential grocery items that form the foundation of Canadian households. 
          These staples were selected based on consumption data and shopping patterns across the country.
        </p>
      </header>

      <div className="bg-blue-50 p-6 rounded-lg mb-12">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">Why Track Staples?</h2>
        <p className="text-blue-800">
          Monitoring the prices of these essential items helps you:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Understand overall grocery inflation trends</li>
            <li>Make informed decisions about when and where to shop</li>
            <li>Plan your grocery budget more effectively</li>
            <li>Compare prices across different stores easily</li>
          </ul>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {staples.map((category, index) => (
            <div key={category._id} className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">#{index + 1}</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-green-600 font-semibold">
                    Best price: ${Math.min(...category.canonicalItems.map(item => item.originalItem.current_price))}
                  </span>
                  <span className="text-gray-500">
                    Available at {category.canonicalItems.length} stores
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceryStaples; 