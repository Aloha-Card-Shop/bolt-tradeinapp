
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, ClipboardList, UserCircle, DollarSign, LogOut, Barcode } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';

interface AdminNavProps {
  userRole: 'admin' | 'manager' | 'user';
}

const AdminNav: React.FC<AdminNavProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {  } = useSession();

  if (userRole !== 'admin' && userRole !== 'manager') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive('/dashboard')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
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
                  }`}
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
                  }`}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Trade-Ins
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
                  }`}
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
                  }`}
                >
                  <Barcode className="h-4 w-4 mr-2" />
                  Barcodes
                </button>

                <button
                  onClick={() => navigate('/admin')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive('/admin')
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </>
            )}
          </div>
          
          <div>
            <button 
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;
