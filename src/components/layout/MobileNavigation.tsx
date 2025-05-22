
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Package, UserCircle, Settings } from 'lucide-react';
import { useSession } from '../../hooks/useSession';

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  
  if (!user) return null;
  
  // Determine user role for conditional rendering
  const userRole = user?.user_metadata?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'shopify_manager';
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-4 h-16">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center justify-center space-y-1"
          aria-label="Dashboard"
        >
          <Home className={`h-5 w-5 ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className={`text-xs ${isActive('/dashboard') ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Home
          </span>
        </button>
        
        <button 
          onClick={() => navigate('/app')}
          className="flex flex-col items-center justify-center space-y-1"
          aria-label="Trade-In App"
        >
          <Package className={`h-5 w-5 ${isActive('/app') ? 'text-green-600' : 'text-gray-500'}`} />
          <span className={`text-xs ${isActive('/app') ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            Trade-In
          </span>
        </button>
        
        {(isAdmin || isManager) && (
          <button 
            onClick={() => navigate('/dashboard/manager')}
            className="flex flex-col items-center justify-center space-y-1"
            aria-label="Manager Dashboard"
          >
            <ClipboardList className={`h-5 w-5 ${isActive('/dashboard/manager') ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className={`text-xs ${isActive('/dashboard/manager') ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Manage
            </span>
          </button>
        )}
        
        {!isAdmin && !isManager && (
          <button 
            onClick={() => navigate('/my-trade-ins')}
            className="flex flex-col items-center justify-center space-y-1"
            aria-label="My Trade-Ins"
          >
            <ClipboardList className={`h-5 w-5 ${isActive('/my-trade-ins') ? 'text-purple-600' : 'text-gray-500'}`} />
            <span className={`text-xs ${isActive('/my-trade-ins') ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
              My Trade-Ins
            </span>
          </button>
        )}
        
        <button 
          onClick={() => isAdmin ? navigate('/admin') : navigate('/my-trade-ins')}
          className="flex flex-col items-center justify-center space-y-1"
          aria-label={isAdmin ? "Admin" : "My Trade-Ins"}
        >
          {isAdmin ? (
            <>
              <Settings className={`h-5 w-5 ${isActive('/admin') ? 'text-red-600' : 'text-gray-500'}`} />
              <span className={`text-xs ${isActive('/admin') ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Admin
              </span>
            </>
          ) : (
            <>
              <UserCircle className={`h-5 w-5 ${isActive('/my-trade-ins') ? 'text-purple-600' : 'text-gray-500'}`} />
              <span className={`text-xs ${isActive('/my-trade-ins') ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                Account
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation;
