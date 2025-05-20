
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layout } from 'lucide-react';
import LogoutButton from '../common/LogoutButton';
import { useSession } from '../../hooks/useSession';
import AdminNav from '../AdminNav';

const AppHeader: React.FC = () => {
  const { user, loading } = useSession();
  const location = useLocation();
  
  // Don't show header on login page
  if (location.pathname === '/' && !user) return null;

  // Determine user role
  const userRole = user?.user_metadata?.role || 'user';
  
  return (
    <>
      <header className="bg-white shadow-sm py-2 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            
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
          
          {!loading && user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.email} ({userRole})
              </span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>
      
      {/* Render AdminNav component for admin/manager pages */}
      {(userRole === 'admin' || userRole === 'manager' || userRole === 'shopify_manager') && (
        <AdminNav userRole={userRole as 'admin' | 'manager' | 'user' | 'shopify_manager'} />
      )}
    </>
  );
};

export default AppHeader;
