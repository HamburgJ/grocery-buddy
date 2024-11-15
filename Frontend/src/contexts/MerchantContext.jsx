import { createContext, useState, useContext, useEffect } from 'react';
import { env } from '../config/environment';

const MerchantContext = createContext();

export const useMerchants = () => useContext(MerchantContext);

export const MerchantProvider = ({ children }) => {
  const [selectedMerchants, setSelectedMerchants] = useState(() => {
    const saved = localStorage.getItem('selectedMerchants');
    return saved ? JSON.parse(saved) : null;
  });
  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch(`${env.API_URL}/merchants/`);
        const data = await response.json();
        setMerchants(data);
        if (!selectedMerchants) {
          const merchantIds = data.map(merchant => merchant._id);
          setSelectedMerchants(merchantIds);
        }
      } catch (error) {
        console.error('Failed to fetch merchants', error);
      }
    };

    fetchMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchants) {
      localStorage.setItem('selectedMerchants', JSON.stringify(selectedMerchants));
    }
  }, [selectedMerchants]);

  return (
    <MerchantContext.Provider value={{ 
      selectedMerchants, 
      setSelectedMerchants,
      merchants
    }}>
      {children}
    </MerchantContext.Provider>
  );
};