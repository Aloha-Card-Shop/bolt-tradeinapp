
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Settings, ClipboardList, UserCircle, DollarSign, 
  LogOut, Barcode, Printer, ShoppingCart, Map, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface AdminNavProps {
  userRole: 'admin' | 'manager' | 'user' | 'shopify_manager';
}

const AdminNav: React.FC<AdminNavProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useSession();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);

  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'shopify_manager') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;
  
  const toggleMobileNav = () => {
    setMobileNavExpanded(!mobileNavExpanded);
  };

  // Get current section for mobile nav title
  const getCurrentSectionTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/admin/customers') return 'Customers';
    if (path === '/dashboard/manager') return 'Trade-Ins';
    if (path === '/admin/shopify-settings') return 'Shopify Settings';
    if (path === '/admin/shopify-mappings') return 'Shopify Mappings';
    if (path === '/admin/trade-values') return 'Trade Values';
    if (path === '/admin/barcodes') return 'Barcodes';
    if (path === '/admin/printers') return 'Printers';
    if (path === '/admin') return 'Settings';
    return 'Admin Navigation';
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Toggle Button */}
        {isMobile && (
          <button 
            onClick={toggleMobileNav}
            className="w-full py-3 flex items-center justify-between"
          >
            <span className="font-medium text-gray-900">{getCurrentSectionTitle()}</span>
            {mobileNavExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>
        )}
        
        {/* Desktop Navigation or Expanded Mobile Navigation */}
        <div className={`${isMobile ? (mobileNavExpanded ? 'block' : 'hidden') : 'block'}`}>
          <div className={`${isMobile ? 'flex flex-col space-y-1 py-2' : 'flex items-center justify-between h-16'}`}>
            <div className={`${isMobile ? 'space-y-1' : 'flex items-center space-x-8'}`}>
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }${isMobile ? ' w-full' : ''}`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </button>

              {(userRole === 'admin' || userRole === 'manager') && (
                <>
                  <button
                    onClick={() => navigate('/admin/customers')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/customers')
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Customers
                  </button>

                  <button
                    onClick={() => navigate('/dashboard/manager')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/dashboard/manager')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Trade-Ins
                  </button>
                </>
              )}

              {/* Shopify Integration Links */}
              {(userRole === 'admin' || userRole === 'shopify_manager') && (
                <>
                  <button
                    onClick={() => navigate('/admin/shopify-settings')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/shopify-settings')
                        ? 'text-cyan-600 bg-cyan-50'
                        : 'text-gray-600 hover:text-cyan-600 hover:bg-cyan-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Shopify Settings
                  </button>

                  <button
                    onClick={() => navigate('/admin/shopify-mappings')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/shopify-mappings')
                        ? 'text-cyan-600 bg-cyan-50'
                        : 'text-gray-600 hover:text-cyan-600 hover:bg-cyan-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Shopify Mappings
                  </button>
                </>
              )}

              {userRole === 'admin' && (
                <>
                  <button
                    onClick={() => navigate('/admin/trade-values')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/trade-values')
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Trade Values
                  </button>

                  <button
                    onClick={() => navigate('/admin/barcodes')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/barcodes')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <Barcode className="h-4 w-4 mr-2" />
                    Barcodes
                  </button>

                  <button
                    onClick={() => navigate('/admin/printers')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin/printers')
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Printers
                  </button>

                  <button
                    onClick={() => navigate('/admin')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive('/admin')
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }${isMobile ? ' w-full' : ''}`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                </>
              )}
            </div>
            
            {/* Sign Out Button - Only show in mobile view when expanded */}
            {isMobile && (
              <button 
                onClick={signOut}
                className="flex items-center px-3 py-2 mt-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            )}
            
            {/* Desktop Sign Out Button */}
            {!isMobile && (
              <div>
                <button 
                  onClick={signOut}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;
