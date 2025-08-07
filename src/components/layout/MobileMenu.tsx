
import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useSession } from '../../hooks/useSession';

interface MobileMenuProps {
  user: any; // Using 'any' to match the existing type in useSession
  loading: boolean;
  userRole: string;
  isAdmin: boolean;
  isManager: boolean;
  closeMobileMenu: () => void;
  handleNavigation: (path: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  user, 
  loading, 
  userRole,
  isAdmin,
  isManager, 
  closeMobileMenu, 
  handleNavigation 
}) => {
  const { signOut } = useSession();

  return (
    <div className="md:hidden dropdown-overlay" onClick={closeMobileMenu}>
      <div 
        className="fixed inset-y-0 right-0 w-64 bg-card text-card-foreground border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium text-foreground">Menu</h2>
          <button onClick={closeMobileMenu} className="p-2 rounded-full hover:bg-muted/50">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* User Info - Mobile */}
        {!loading && user && (
          <div className="p-4 border-b border-border">
            <div className="text-sm font-medium text-foreground">{user.email}</div>
            <div className="text-xs text-muted-foreground">Role: {userRole}</div>
          </div>
        )}
        
        {/* Mobile Menu Links */}
        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-muted/50 rounded-lg"
              >
                <span className="text-foreground">Dashboard</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('/app')}
                className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-muted/50 rounded-lg"
              >
                <span className="text-foreground">Trade-In App</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('/my-trade-ins')}
                className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-muted/50 rounded-lg"
              >
                <span className="text-foreground">My Trade-Ins</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
            
            {(isAdmin || isManager) && (
              <li>
                <button
                  onClick={() => handleNavigation('/dashboard/manager')}
                  className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-muted/50 rounded-lg"
                >
                  <span className="text-foreground">Trade-In Management</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            )}
            
            {isAdmin && (
              <li>
                <button
                  onClick={() => handleNavigation('/admin')}
                  className="w-full text-left px-4 py-2 flex justify-between items-center hover:bg-muted/50 rounded-lg"
                >
                  <span className="text-foreground">Admin Settings</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            )}
          </ul>
        </nav>
        
        {/* Sign Out Button - Mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={signOut}
            className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
