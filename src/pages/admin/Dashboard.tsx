
import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

const Dashboard: React.FC = () => {
  const { user } = useSession();
  const userRole = user?.user_metadata?.role || 'user';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/app" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-medium mb-2">Trade-In App</h2>
            <p className="text-gray-600">Process new trade-ins</p>
          </Link>
          
          <Link to="/my-trade-ins" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-medium mb-2">My Trade-Ins</h2>
            <p className="text-gray-600">View your submitted trade-ins</p>
          </Link>
          
          {(userRole === 'admin' || userRole === 'shopify_manager') && (
            <>
              <Link to="/admin/shopify/settings" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">Shopify Settings</h2>
                <p className="text-gray-600">Configure Shopify integration</p>
              </Link>
              
              <Link to="/admin/shopify/mappings" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">Shopify Mappings</h2>
                <p className="text-gray-600">Manage Shopify field mappings</p>
              </Link>
            </>
          )}
          
          {userRole === 'admin' && (
            <>
              <Link to="/admin/users" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">User Management</h2>
                <p className="text-gray-600">Manage staff users and roles</p>
              </Link>
              
              <Link to="/admin/api-settings" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">API Settings</h2>
                <p className="text-gray-600">Manage API keys for external services</p>
              </Link>
              
              <Link to="/admin/trade-values" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">Trade Values</h2>
                <p className="text-gray-600">Configure trade-in value settings</p>
              </Link>
              
              <Link to="/admin/barcodes" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">Barcode Generation</h2>
                <p className="text-gray-600">Generate and configure barcodes</p>
              </Link>
              
              <Link to="/admin/printers" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-lg font-medium mb-2">Printer Settings</h2>
                <p className="text-gray-600">Manage print settings and templates</p>
              </Link>
            </>
          )}
          
          {(userRole === 'admin' || userRole === 'manager') && (
            <Link to="/dashboard/manager" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-medium mb-2">Manager Dashboard</h2>
              <p className="text-gray-600">Manage and review trade-ins</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
