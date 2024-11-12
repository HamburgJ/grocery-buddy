import { Link, useLocation } from 'react-router-dom';
import { Search as SearchIcon, Heart, Tag, Home, ShoppingBasket } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';

export const Navbar = () => {
  const location = useLocation();
  const { favorites } = useFavorites();
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="ml-2 text-xl font-logo font-bold text-gray-900">Grocery Buddy</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <NavLink to="/" icon={<Home size={20} />} label="Home" />
            <NavLink to="/deals" icon={<Tag size={20} />} label="Deals" />
            <NavLink to="/search" icon={<SearchIcon size={20} />} label="Search" />
            <NavLink 
              to="/favorites" 
              icon={<Heart size={20} />} 
              label={`Favorites (${favorites.length})`} 
            />
            <NavLink 
              to="/staples" 
              icon={<ShoppingBasket size={20} />} 
              label="Staples" 
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  );
};