import { useState, useEffect } from 'react';
import { CategoryGrid } from '../components/CategoryGrid';
import { fetchDeals } from '../api/categories';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const result = await fetchDeals();
        setDeals(result.data);
      } catch (error) {
        console.error('Failed to load deals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDeals();
  }, []);

  return (
    <div>
      <header className="text-center mb-8">
        <h1 className="text-3xl font-logo font-bold text-gray-900">Best Deals This Week</h1>
        <p className="text-gray-600 mt-2 font-body">
          Hand-picked deals with the biggest savings across all categories
        </p>
      </header>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <CategoryGrid categories={deals} />
      )}
    </div>
  );
};

export default Deals;