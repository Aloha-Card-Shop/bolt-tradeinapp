
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Settings, ClipboardList, UserCircle, DollarSign, 
  LogOut, Barcode, Printer, ShoppingCart, Map, Key
} from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import AdminNavLink from './AdminNavLink';

interface AdminNavDesktopProps {
  userRole: 'admin' | 'manager' | 'user' | 'shopify_manager';
}

const AdminNavDesktop: React.FC<AdminNavDesktopProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const { signOut } = useSession();
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center space-x-8">
        {/* Common Links for all roles */}
        <AdminNavLink 
          icon={Home} 
          label="Dashboard" 
          path="/dashboard" 
          onClick={() => handleNavigation('/dashboard')} 
          activeColor="blue"
        />
        
        {/* Manager & Admin Links */}
        {(userRole === 'admin' || userRole === 'manager') && (
          <>
            <AdminNavLink 
              icon={UserCircle} 
              label="Customers" 
              path="/admin/customers" 
              onClick={() => handleNavigation('/admin/customers')} 
              activeColor="red"
            />
            <AdminNavLink 
              icon={ClipboardList} 
              label="Trade-Ins" 
              path="/dashboard/manager" 
              onClick={() => handleNavigation('/dashboard/manager')} 
              activeColor="blue"
            />
          </>
        )}
        
        {/* Shopify Integration Links */}
        {(userRole === 'admin' || userRole === 'shopify_manager') && (
          <>
            <AdminNavLink 
              icon={ShoppingCart} 
              label="Shopify Settings" 
              path="/admin/shopify-settings" 
              onClick={() => handleNavigation('/admin/shopify-settings')} 
              activeColor="cyan"
            />
            <AdminNavLink 
              icon={Map} 
              label="Shopify Mappings" 
              path="/admin/shopify-mappings" 
              onClick={() => handleNavigation('/admin/shopify-mappings')} 
              activeColor="cyan"
            />
          </>
        )}
        
        {/* Admin Only Links */}
        {userRole === 'admin' && (
          <>
            <AdminNavLink 
              icon={Key} 
              label="API Settings" 
              path="/admin/api-settings" 
              onClick={() => handleNavigation('/admin/api-settings')} 
              activeColor="amber"
            />
            <AdminNavLink 
              icon={DollarSign} 
              label="Trade Values" 
              path="/admin/trade-values" 
              onClick={() => handleNavigation('/admin/trade-values')} 
              activeColor="purple"
            />
            <AdminNavLink 
              icon={Barcode} 
              label="Barcodes" 
              path="/admin/barcodes" 
              onClick={() => handleNavigation('/admin/barcodes')} 
              activeColor="indigo"
            />
            <AdminNavLink 
              icon={Printer} 
              label="Printers" 
              path="/admin/printers" 
              onClick={() => handleNavigation('/admin/printers')} 
              activeColor="green"
            />
            <AdminNavLink 
              icon={Settings} 
              label="Settings" 
              path="/admin" 
              onClick={() => handleNavigation('/admin')} 
              activeColor="red"
            />
          </>
        )}
      </div>

      {/* Desktop Sign Out Button */}
      <div>
        <button 
          onClick={signOut}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminNavDesktop;
