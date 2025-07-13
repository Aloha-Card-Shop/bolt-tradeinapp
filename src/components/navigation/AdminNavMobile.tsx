
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Settings, ClipboardList, UserCircle, DollarSign, 
  LogOut, Barcode, Printer, ShoppingCart, Map, Key, Package
} from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import AdminNavLink from './AdminNavLink';

interface AdminNavMobileProps {
  userRole: 'admin' | 'manager' | 'user' | 'shopify_manager';
  mobileNavExpanded: boolean;
}

const AdminNavMobile: React.FC<AdminNavMobileProps> = ({ userRole, mobileNavExpanded }) => {
  const navigate = useNavigate();
  const { signOut } = useSession();
  
  if (!mobileNavExpanded) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col space-y-1 py-2">
      {/* Common Links for all roles */}
      <AdminNavLink 
        icon={Home} 
        label="Dashboard" 
        path="/dashboard" 
        onClick={() => handleNavigation('/dashboard')} 
        activeColor="blue"
        isMobile
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
            isMobile
          />
          <AdminNavLink 
            icon={ClipboardList} 
            label="Trade-Ins" 
            path="/dashboard/manager" 
            onClick={() => handleNavigation('/dashboard/manager')} 
            activeColor="blue"
            isMobile
          />
        </>
      )}
      
      {/* Shopify Integration Links */}
      {(userRole === 'admin' || userRole === 'shopify_manager') && (
        <>
          <AdminNavLink 
            icon={ShoppingCart} 
            label="Shopify Settings" 
            path="/admin/shopify/settings" 
            onClick={() => handleNavigation('/admin/shopify/settings')} 
            activeColor="cyan"
            isMobile
          />
          <AdminNavLink 
            icon={Map} 
            label="Shopify Mappings" 
            path="/admin/shopify/mappings" 
            onClick={() => handleNavigation('/admin/shopify/mappings')} 
            activeColor="cyan"
            isMobile
          />
        </>
      )}

      {/* Manager & Admin Links */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <AdminNavLink 
          icon={Package} 
          label="Card Inventory" 
          path="/admin/inventory" 
          onClick={() => handleNavigation('/admin/inventory')} 
          activeColor="purple"
          isMobile
        />
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
            isMobile
          />
          <AdminNavLink 
            icon={DollarSign} 
            label="Trade Values" 
            path="/admin/trade-values" 
            onClick={() => handleNavigation('/admin/trade-values')} 
            activeColor="purple"
            isMobile
          />
          <AdminNavLink 
            icon={Barcode} 
            label="Barcodes" 
            path="/admin/barcodes" 
            onClick={() => handleNavigation('/admin/barcodes')} 
            activeColor="indigo"
            isMobile
          />
          <AdminNavLink 
            icon={Printer} 
            label="Printers" 
            path="/admin/printers" 
            onClick={() => handleNavigation('/admin/printers')} 
            activeColor="green"
            isMobile
          />
          <AdminNavLink 
            icon={Settings} 
            label="Settings" 
            path="/admin" 
            onClick={() => handleNavigation('/admin')} 
            activeColor="red"
            isMobile
          />
        </>
      )}
      
      {/* Sign Out Button */}
      <button 
        onClick={signOut}
        className="flex items-center px-3 py-2 mt-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </button>
    </div>
  );
};

export default AdminNavMobile;
