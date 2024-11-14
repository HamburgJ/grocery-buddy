import { Link, useLocation } from 'react-router-dom';
import { Search as SearchIcon, Heart, Tag, Home, ShoppingBasket, Menu } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useState } from 'react';

const LOGO_EMOJIS = "🍎🥕🥛🥩🥫";

const NavLink = ({ to, icon, label }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
        ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { favorites } = useFavorites();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl" role="img" aria-label="Food categories">
                {LOGO_EMOJIS}
              </span>
              <span className="ml-2 text-xl font-logo font-bold text-gray-900">
                Grocery Buddy
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <NavLink to="/" icon={<Home size={20} />} label="Home" />
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

        {/* Mobile Navigation */}
        <div className="flex lg:hidden justify-between h-14">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl" role="img" aria-label="Food categories">
                {LOGO_EMOJIS}
              </span>
              <span className="font-bold text-gray-900">Grocery Buddy</span>
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} lg:hidden border-t ml-auto`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
            <MobileNavLink to="/" label="Home" icon={<Home size={18} />} />
            <MobileNavLink to="/deals" label="Deals" icon={<Tag size={18} />} />
            <MobileNavLink to="/search" label="Search" icon={<SearchIcon size={18} />} />
            <MobileNavLink 
              to="/favorites" 
              label={`Favorites (${favorites.length})`} 
              icon={<Heart size={18} />} 
            />
            <MobileNavLink to="/staples" label="Staples" icon={<ShoppingBasket size={18} />} />
          </div>
        </div>
      </div>
    </nav>
  );
};

const MobileNavLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-3 py-2 rounded-md text-base text-gray-600 hover:bg-gray-50"
  >
    {icon}
    <span>{label}</span>
  </Link>
);