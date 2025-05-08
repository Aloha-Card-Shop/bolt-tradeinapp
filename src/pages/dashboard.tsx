import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Users, ShoppingBag, ChevronRight, Loader2, ClipboardList, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const userRole = user.user_metadata.role || 'user';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Welcome back</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <span className="px-2 py-1 text-xs font-medium rounded-full capitalize" 
                    style={{
                      backgroundColor: 
                        userRole === 'admin' ? 'rgb(220 38 38 / 0.1)' : 
                        userRole === 'manager' ? 'rgb(37 99 235 / 0.1)' : 
                        'rgb(22 163 74 / 0.1)',
                      color: 
                        userRole === 'admin' ? 'rgb(185 28 28)' : 
                        userRole === 'manager' ? 'rgb(29 78 216)' : 
                        'rgb(21 128 61)'
                    }}
                  >
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Customer Tools - Available to all users */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Tools</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage trade-ins, check prices, and track orders
            </p>
            <button 
              onClick={() => navigate('/app')}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              Open Trade-In App
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Customer Management - Admin and Manager */}
          {(userRole === 'admin' || userRole === 'manager') && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Manage customer accounts and information
              </p>
              <button 
                onClick={() => navigate('/admin/customers')}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
              >
                Manage Customers
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Trade Value Settings - Admin only */}
          {userRole === 'admin' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Trade Values</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Configure trade-in percentages and value ranges
              </p>
              <button 
                onClick={() => navigate('/admin/trade-values')}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
              >
                Configure Values
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Admin Settings - Admin only */}
          {userRole === 'admin' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Admin Settings</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Configure system settings and preferences
              </p>
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                Open Settings
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Trade-In Management - Admin and Manager */}
          {(userRole === 'admin' || userRole === 'manager') && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Trade-In Management</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Review and process customer trade-in requests
              </p>
              <button 
                onClick={() => navigate('/dashboard/manager')}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                Manage Trade-Ins
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;