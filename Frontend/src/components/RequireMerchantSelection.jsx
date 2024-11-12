import { useState, useEffect } from 'react';
import { useMerchants } from '../contexts/MerchantContext';
import { MerchantSelectionModal } from './MerchantSelectionModal';

export const RequireMerchantSelection = ({ children }) => {
  const { selectedMerchants } = useMerchants();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!selectedMerchants) {
      setShowModal(true);
    }
  }, [selectedMerchants]);

  if (showModal) {
    return <MerchantSelectionModal onComplete={() => setShowModal(false)} />;
  }

  return children;
}; 