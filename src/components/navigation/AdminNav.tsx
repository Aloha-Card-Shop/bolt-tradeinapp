
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import AdminNavDesktop from './AdminNavDesktop';
import AdminNavMobile from './AdminNavMobile';

interface AdminNavProps {
  userRole: 'admin' | 'manager' | 'user' | 'shopify_manager';
}

const AdminNav: React.FC<AdminNavProps> = ({ userRole }) => {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);
  
  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'shopify_manager') {
    return null;
  }

  const toggleMobileNav = () => {
    setMobileNavExpanded(!mobileNavExpanded);
  };

  // Get current section for mobile nav title
  const getCurrentSectionTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/admin/customers') return 'Customers';
    if (path === '/dashboard/manager') return 'Trade-Ins';
    if (path === '/admin/shopify/settings') return 'Shopify Settings';
    if (path === '/admin/shopify/mappings') return 'Shopify Mappings';
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
          {isMobile ? (
            <AdminNavMobile 
              userRole={userRole} 
              mobileNavExpanded={mobileNavExpanded} 
            />
          ) : (
            <AdminNavDesktop userRole={userRole} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNav;
