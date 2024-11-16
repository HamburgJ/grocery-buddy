import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, logPageView } from './services/analytics';
import { Layout } from './components/layout/Layout';
import { MerchantProvider } from './contexts/MerchantContext';
import { FilterProvider } from './contexts/FilterContext';
import AppRoutes from './routes';

function App() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    logPageView(path);
  }, [location]);

  return (
    <FilterProvider>
      <MerchantProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </MerchantProvider>
    </FilterProvider>
  );
}

export default App; 