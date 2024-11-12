import { createContext, useState, useContext, useEffect } from 'react';

const MerchantContext = createContext();

export const useMerchants = () => useContext(MerchantContext);

export const MerchantProvider = ({ children }) => {
  const [selectedMerchants, setSelectedMerchants] = useState(() => {
    const saved = localStorage.getItem('selectedMerchants');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedMerchants) {
      localStorage.setItem('selectedMerchants', JSON.stringify(selectedMerchants));
    }
  }, [selectedMerchants]);

  return (
    <MerchantContext.Provider value={{ selectedMerchants, setSelectedMerchants }}>
      {children}
    </MerchantContext.Provider>
  );
}; 