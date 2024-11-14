import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-4xl font-logo font-bold text-gray-900 mb-6">
        Page Not Found
      </h1>
      <p className="text-xl font-body text-gray-600 mb-12">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        to="/"
        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound; 