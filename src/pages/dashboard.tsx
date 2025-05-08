
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { Card, ShoppingBag, Users, Settings, PieChart, BadgeDollarSign } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const userRole = user?.user_metadata?.role || 'user';

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleNavigation('/app')}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Card className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Card Search</h2>
            </div>
            <p className="text-gray-600">Search for card prices and check market values.</p>
          </div>

          {(userRole === 'admin' || userRole === 'manager') && (
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNavigation('/admin/customers')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
              </div>
              <p className="text-gray-600">View and manage customer information.</p>
            </div>
          )}

          {(userRole === 'admin' || userRole === 'manager') && (
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNavigation('/dashboard/manager')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Trade-In Management</h2>
              </div>
              <p className="text-gray-600">Review and process customer trade-ins.</p>
            </div>
          )}

          {userRole === 'admin' && (
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNavigation('/admin/users')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
              </div>
              <p className="text-gray-600">Manage staff accounts and permissions.</p>
            </div>
          )}

          {userRole === 'admin' && (
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNavigation('/admin/trade-values')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <BadgeDollarSign className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Trade Values</h2>
              </div>
              <p className="text-gray-600">Configure the trade-in values for cards.</p>
            </div>
          )}

          {userRole === 'admin' && (
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNavigation('/admin')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PieChart className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
              </div>
              <p className="text-gray-600">View store performance and trade-in metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
