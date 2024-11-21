import { createContext, useState, useContext, useEffect } from 'react';
import { env } from '../config/environment';
import { useFilters } from './FilterContext';

const MerchantContext = createContext();

export const useMerchants = () => useContext(MerchantContext);

export const MerchantProvider = ({ children }) => {
  const [merchants, setMerchants] = useState([]);
  const { initializeMerchants } = useFilters();

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch(`${env.API_URL}/merchants/`);
        const data = await response.json();
        const sortedMerchants = data.sort((a, b) => a.name.localeCompare(b.name));
        setMerchants(sortedMerchants);
        initializeMerchants(sortedMerchants.map(m => m.merchant_id));
      } catch (error) {
        console.error('Failed to fetch merchants', error);
      }
    };

    fetchMerchants();
  }, []);

  return (
    <MerchantContext.Provider value={{ merchants }}>
      {children}
    </MerchantContext.Provider>
  );
};