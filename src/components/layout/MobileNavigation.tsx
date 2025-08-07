
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="grid grid-cols-4 h-16">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center justify-center space-y-1"
          aria-label="Dashboard"
        >
          <Home className={`h-5 w-5 ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${isActive('/dashboard') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Home
          </span>
        </button>
        
        <button 
          onClick={() => navigate('/app')}
          className="flex flex-col items-center justify-center space-y-1"
          aria-label="Trade-In App"
        >
          <Package className={`h-5 w-5 ${isActive('/app') ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${isActive('/app') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            Trade-In
          </span>
        </button>
        
        {(isAdmin || isManager) && (
          <button 
            onClick={() => navigate('/dashboard/manager')}
            className="flex flex-col items-center justify-center space-y-1"
            aria-label="Manager Dashboard"
          >
            <ClipboardList className={`h-5 w-5 ${isActive('/dashboard/manager') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/dashboard/manager') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
            <ClipboardList className={`h-5 w-5 ${isActive('/my-trade-ins') ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive('/my-trade-ins') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
              <Settings className={`h-5 w-5 ${isActive('/admin') ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isActive('/admin') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Admin
              </span>
            </>
          ) : (
            <>
              <UserCircle className={`h-5 w-5 ${isActive('/my-trade-ins') ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isActive('/my-trade-ins') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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
