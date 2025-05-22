
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layout, Menu, X, ChevronRight } from 'lucide-react';
import LogoutButton from '../common/LogoutButton';
import { useSession } from '../../hooks/useSession';
import AdminNav from '../AdminNav';
import DesktopNavigation from './DesktopNavigation';
import UserInfo from './UserInfo';
import MobileMenu from './MobileMenu';

const AppHeader: React.FC = () => {
  const { user, loading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Don't show header on login page
  if (location.pathname === '/' && !user) return null;

  // Determine user role
  const userRole = user?.user_metadata?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'shopify_manager';
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };
  
  return (
    <>
      <header className="bg-white shadow-sm py-2 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Home Link */}
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <DesktopNavigation userRole={userRole} />
          
          {/* User Info - Desktop */}
          {!loading && user && (
            <UserInfo user={user} userRole={userRole} className="hidden md:flex" />
          )}
          
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <MobileMenu 
          user={user} 
          loading={loading} 
          userRole={userRole} 
          isAdmin={isAdmin}
          isManager={isManager}
          closeMobileMenu={closeMobileMenu} 
          handleNavigation={handleNavigation} 
        />
      )}
      
      {/* Render AdminNav component for admin/manager pages */}
      {(userRole === 'admin' || userRole === 'manager' || userRole === 'shopify_manager') && (
        <AdminNav userRole={userRole as 'admin' | 'manager' | 'user' | 'shopify_manager'} />
      )}
    </>
  );
};

export default AppHeader;
