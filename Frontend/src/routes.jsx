import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import GroceryStaples from './pages/GroceryStaples';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/search" element={
        <Search />
    } />
    <Route path="/favorites" element={
        <Favorites />
    } />
    <Route path="/staples" element={
        <GroceryStaples />
    } />
  </Routes>
);

export default AppRoutes;