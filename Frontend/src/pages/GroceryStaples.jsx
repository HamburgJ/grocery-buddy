import { useState, useEffect } from 'react';
import { env } from '../config/environment';
import { CategoryCard } from '../components/CategoryCard';
import { useFilters } from '../contexts/FilterContext';

const GroceryStaples = () => {
  const [staples, setStaples] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filters } = useFilters();

  useEffect(() => {
    const fetchStaples = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.merchants?.length) {
          params.append('merchants', filters.merchants.join(','));
        }

        const response = await fetch(`${env.API_URL}/staples?${params}`);
        if (!response.ok) throw new Error('Failed to fetch staples');
        const data = await response.json();
        setStaples(data);
      } catch (error) {
        console.error('Failed to fetch grocery staples', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaples();
  }, [filters.merchants]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-logo font-bold text-gray-900 mb-6">
          Essential Staples
        </h1>
        <p className="text-xl font-body text-gray-600">
          Track prices of the top {staples.metadata.totalCount || 0} grocery staples in Canada
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Showing {staples.metadata.totalItems || 0} items across all categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staples.data.map((category) => (
          <CategoryCard key={category._id} category={category} />
        ))}
      </div>

      {staples.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No staples found</p>
        </div>
      )}
    </div>
  );
};

export default GroceryStaples;