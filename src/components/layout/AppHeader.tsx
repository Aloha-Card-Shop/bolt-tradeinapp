
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layout, Menu, X, ChevronRight } from 'lucide-react';
import LogoutButton from '../common/LogoutButton';
import { useSession } from '../../hooks/useSession';
import AdminNav from '../AdminNav';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const AppHeader: React.FC = () => {
  const { user, loading, signOut } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
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
          <div className="hidden md:flex space-x-4">
            <Link 
              to="/app" 
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Trade-In App
            </Link>
            
            <Link 
              to="/my-trade-ins" 
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              My Trade-Ins
            </Link>

            {userRole === 'admin' && (
              <Link 
                to="/admin" 
                className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Layout className="h-5 w-5 mr-1 inline" />
                Admin Settings
              </Link>
            )}
          </div>
          
          {/* User Info - Desktop */}
          {!loading && user && (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.email} ({userRole})
              </span>
              <LogoutButton />
            </div>
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
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-25" onClick={closeMobileMenu}>
          <div 
            className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-medium">Menu</h2>
              <button onClick={closeMobileMenu} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* User Info - Mobile */}
            {!loading && user && (
              <div className="p-4 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                <div className="text-xs text-gray-500">Role: {userRole}</div>
              </div>
            )}
            
            {/* Mobile Menu Links */}
            <nav className="p-2">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleNavigation('/dashboard')}
                    className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-100 rounded-lg"
                  >
                    <span className="text-gray-700">Dashboard</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/app')}
                    className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-100 rounded-lg"
                  >
                    <span className="text-gray-700">Trade-In App</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation('/my-trade-ins')}
                    className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-100 rounded-lg"
                  >
                    <span className="text-gray-700">My Trade-Ins</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </li>
                
                {(isAdmin || isManager) && (
                  <li>
                    <button
                      onClick={() => handleNavigation('/dashboard/manager')}
                      className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-100 rounded-lg"
                    >
                      <span className="text-gray-700">Trade-In Management</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </li>
                )}
                
                {isAdmin && (
                  <li>
                    <button
                      onClick={() => handleNavigation('/admin')}
                      className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-gray-100 rounded-lg"
                    >
                      <span className="text-gray-700">Admin Settings</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </li>
                )}
              </ul>
            </nav>
            
            {/* Sign Out Button - Mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <button
                onClick={signOut}
                className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Render AdminNav component for admin/manager pages */}
      {(userRole === 'admin' || userRole === 'manager' || userRole === 'shopify_manager') && (
        <AdminNav userRole={userRole as 'admin' | 'manager' | 'user' | 'shopify_manager'} />
      )}
    </>
  );
};

export default AppHeader;
