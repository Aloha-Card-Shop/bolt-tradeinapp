
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut,
  Package,
  UserCircle,
  ClipboardList,
  DollarSign,
  Settings,
  ChevronRight,
  Receipt,
  Barcode,
  ShoppingCart,
  Map,
  Menu
} from 'lucide-react';
import { useSession } from '../hooks/useSession';

const Dashboard: React.FC = () => {
  const { user, signOut } = useSession();
  const userRole = user?.user_metadata?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isShopifyManager = userRole === 'shopify_manager';
  const isStaff = isAdmin || isManager;
  const canManageShopify = isAdmin || isShopifyManager;
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <UserCircle className="h-6 w-6 text-blue-500" />
            </div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md bg-gray-50 text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-sm text-gray-800">{user?.email}</p>
              <button 
                onClick={signOut}
                className="flex items-center text-sm text-red-600"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>
            {isAdmin && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full mb-2">
                Admin
              </span>
            )}
            {isManager && !isAdmin && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full mb-2">
                Manager
              </span>
            )}
          </div>
        )}
      </div>

      {/* Desktop User Welcome Section */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3">
              <UserCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Welcome back</h2>
              <div className="flex items-center">
                <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                {isAdmin && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                    Admin
                  </span>
                )}
                {isManager && !isAdmin && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Manager
                  </span>
                )}
                {isShopifyManager && !isAdmin && !isManager && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                    Shopify Manager
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 mr-1" />
            Sign Out
          </button>
        </div>

        {/* Dashboard Cards Grid - Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Trade In Card (previously Customer Tools) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">Trade In</h2>
            </div>
            <p className="text-gray-600 mb-6">Manage trade-ins, check prices, and track orders</p>
            <Link 
              to="/app" 
              className="group flex items-center justify-between px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              <span>Open Trade-In App</span>
              <ChevronRight className="h-5 w-5 text-green-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* My Trade-Ins Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">My Trade-Ins</h2>
            </div>
            <p className="text-gray-600 mb-6">View your submitted trade-ins and their status</p>
            <Link 
              to="/my-trade-ins" 
              className="group flex items-center justify-between px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              <span>View Trade-Ins</span>
              <ChevronRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Barcode Management Card - New addition */}
          {isStaff && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Barcode className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Barcode Templates</h2>
              </div>
              <p className="text-gray-600 mb-6">Manage barcode templates and printing settings</p>
              <Link 
                to="/admin/barcodes" 
                className="group flex items-center justify-between px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
              >
                <span>Manage Templates</span>
                <ChevronRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Customer Management Card */}
          {isStaff && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <UserCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Customer Management</h2>
              </div>
              <p className="text-gray-600 mb-6">Manage customer accounts and information</p>
              <Link 
                to="/admin/customers" 
                className="group flex items-center justify-between px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                <span>Manage Customers</span>
                <ChevronRight className="h-5 w-5 text-red-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Trade Values Card */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Trade Values</h2>
              </div>
              <p className="text-gray-600 mb-6">Configure trade-in percentages and value ranges</p>
              <Link 
                to="/admin/trade-values" 
                className="group flex items-center justify-between px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
              >
                <span>Configure Values</span>
                <ChevronRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Shopify Settings Card */}
          {canManageShopify && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-cyan-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Shopify Integration</h2>
              </div>
              <p className="text-gray-600 mb-6">Configure Shopify integration settings and API keys</p>
              <Link 
                to="/admin/shopify-settings" 
                className="group flex items-center justify-between px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors"
              >
                <span>Shopify Settings</span>
                <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Shopify Mappings Card - New addition */}
          {canManageShopify && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Map className="h-6 w-6 text-cyan-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Shopify Mappings</h2>
              </div>
              <p className="text-gray-600 mb-6">Configure field mappings for Shopify product integration</p>
              <Link 
                to="/admin/shopify-mappings" 
                className="group flex items-center justify-between px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors"
              >
                <span>Field Mappings</span>
                <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Admin Settings Card */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Admin Settings</h2>
              </div>
              <p className="text-gray-600 mb-6">Configure system settings and preferences</p>
              <Link 
                to="/admin" 
                className="group flex items-center justify-between px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <span>Open Settings</span>
                <ChevronRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Trade-In Management Card */}
          {isStaff && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">Trade-In Management</h2>
              </div>
              <p className="text-gray-600 mb-6">Review and process customer trade-in requests</p>
              <Link 
                to="/dashboard/manager" 
                className="group flex items-center justify-between px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <span>Manage Trade-Ins</span>
                <ChevronRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Cards Grid - Mobile */}
      <div className="lg:hidden px-4 py-6">
        <div className="space-y-4">
          {/* Trade In Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">Trade In</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">Manage trade-ins, check prices, and track orders</p>
            <Link 
              to="/app" 
              className="group flex items-center justify-between px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              <span className="text-sm">Open Trade-In App</span>
              <ChevronRight className="h-4 w-4 text-green-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* My Trade-Ins Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">My Trade-Ins</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">View your submitted trade-ins and their status</p>
            <Link 
              to="/my-trade-ins" 
              className="group flex items-center justify-between px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              <span className="text-sm">View Trade-Ins</span>
              <ChevronRight className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Barcode Management Card - New addition */}
          {isStaff && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Barcode className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Barcode Templates</h2>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage barcode templates and printing settings</p>
              <Link 
                to="/admin/barcodes" 
                className="group flex items-center justify-between px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
              >
                <span className="text-sm">Manage Templates</span>
                <ChevronRight className="h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* More cards for mobile - conditionally rendered based on roles */}
          {isStaff && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Trade-In Management</h2>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Review and process customer trade-in requests</p>
              <Link 
                to="/dashboard/manager" 
                className="group flex items-center justify-between px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <span className="text-sm">Manage Trade-Ins</span>
                <ChevronRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
