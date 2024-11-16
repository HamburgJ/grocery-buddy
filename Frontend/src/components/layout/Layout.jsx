import { Navbar } from './Navbar';
import { MerchantSidebar } from './MerchantSidebar';
import { useLocation } from 'react-router-dom';

export const Layout = ({ children }) => {
  const location = useLocation();
  const showSidebar = ['/staples', '/search', '/favorites'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 min-w-full overflow-x-hidden">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="flex gap-6 min-w-0">
          {showSidebar && (
            <div className="hidden xl:block flex-shrink-0">
              <div className="sticky top-6">
                <MerchantSidebar />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};