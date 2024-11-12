import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Deals from './pages/Deals';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import { RequireMerchantSelection } from './components/RequireMerchantSelection';
import GroceryStaples from './pages/GroceryStaples';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/deals" element={
      <RequireMerchantSelection>
        <Deals />
      </RequireMerchantSelection>
    } />
    <Route path="/search" element={
      <RequireMerchantSelection>
        <Search />
      </RequireMerchantSelection>
    } />
    <Route path="/favorites" element={
      <RequireMerchantSelection>
        <Favorites />
      </RequireMerchantSelection>
    } />
    <Route path="/staples" element={
      <RequireMerchantSelection>
        <GroceryStaples />
      </RequireMerchantSelection>
    } />
  </Routes>
);

export default AppRoutes;