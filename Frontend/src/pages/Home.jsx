import { Link } from 'react-router-dom';
import { Search as SearchIcon, Tag, ShoppingBasket } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-4xl font-logo font-bold text-gray-900 mb-6">
        Welcome to Grocery Buddy
      </h1>
      <p className="text-xl font-body text-gray-600 mb-12">
        Discover the best deals across multiple stores, compare prices, and save your favorite items.
      </p>
      
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <FeatureCard
          icon={<Tag className="w-8 h-8" />}
          title="Best Deals"
          description="Find the hottest deals and biggest savings updated daily."
          link="/deals"
        />
        <FeatureCard
          icon={<SearchIcon className="w-8 h-8" />}
          title="Smart Search"
          description="Search and filter through thousands of products easily."
          link="/search"
        />
        <FeatureCard
          icon={<ShoppingBasket className="w-8 h-8" />}
          title="Essential Staples"
          description="Track prices of the top 10 grocery staples in Canada."
          link="/staples"
        />
      </div>
      
      <Link
        to="/staples"
        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
      >
        Explore Deals
      </Link>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, link }) => (
  <Link to={link} className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="flex justify-center mb-4 text-blue-600">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </Link>
);

export default Home;