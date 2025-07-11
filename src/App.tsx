
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './pages/MainApp';
import TradeInReviewPage from './pages/trade-in/TradeInReviewPage';
import CustomerSelectPage from './pages/trade-in/CustomerSelectPage';
import Dashboard from './pages/admin/Dashboard';
import MyTradeIns from './pages/my-trade-ins';
import Login from './pages/login';
import ShopifySettingsPage from './pages/admin/shopify-settings';
import ShopifyMappingsPage from './pages/admin/shopify-mappings';
import AppHeader from './components/layout/AppHeader';
import AuthGuard from './components/AuthGuard';
import AdminPage from './pages/admin';
import TradeValuesPage from './pages/admin/trade-values';
import ManagerDashboard from './pages/dashboard/manager';
import UsersPage from './pages/admin/users';
import BarcodesPage from './pages/admin/barcodes';
import PrintersPage from './pages/admin/printers';
import ApiSettingsPage from './pages/admin/api-settings';
import EbayTestPage from './pages/admin/ebay-test';
import CustomersPage from './pages/admin/customers';
import MobileNavigation from './components/layout/MobileNavigation';
import { useMediaQuery } from './hooks/useMediaQuery';

function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <Router>
      <AuthGuard>
        <AppHeader />
        <div className={`${isMobile ? 'pb-16' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />
            <Route path="/app" element={<MainApp />} />
            <Route path="/trade-in/review" element={<TradeInReviewPage />} />
            <Route path="/customer-select" element={<CustomerSelectPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="/my-trade-ins" element={<MyTradeIns />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/trade-values" element={<TradeValuesPage />} />
            <Route path="/admin/barcodes" element={<BarcodesPage />} />
            <Route path="/admin/printers" element={<PrintersPage />} />
            <Route path="/admin/api-settings" element={<ApiSettingsPage />} />
            <Route path="/admin/ebay-test" element={<EbayTestPage />} />
            <Route path="/admin/shopify/settings" element={<ShopifySettingsPage />} />
            <Route path="/admin/shopify/mappings" element={<ShopifyMappingsPage />} />
          </Routes>
        </div>
        <MobileNavigation />
      </AuthGuard>
    </Router>
  );
}

export default App;
