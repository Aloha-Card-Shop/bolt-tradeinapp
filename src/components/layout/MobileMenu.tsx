
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
  );
};

export default MobileMenu;
