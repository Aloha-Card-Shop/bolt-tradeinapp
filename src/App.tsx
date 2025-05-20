
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSession } from './hooks/useSession';
import MainApp from './pages/MainApp';
import TradeInReviewPage from './pages/trade-in/TradeInReviewPage';
import CustomerSelectPage from './pages/trade-in/CustomerSelectPage';
import Dashboard from './pages/admin/Dashboard';
import MyTradeIns from './pages/my-trade-ins';
import LoginPage from './pages/LoginPage';
import ShopifySettingsPage from './pages/admin/shopify-settings';
import ShopifyMappingsPage from './pages/admin/shopify-mappings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="/trade-in/review" element={<TradeInReviewPage />} />
        <Route path="/customer-select" element={<CustomerSelectPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-trade-ins" element={<MyTradeIns />} />
        <Route path="/admin/shopify/settings" element={<ShopifySettingsPage />} />
        <Route path="/admin/shopify/mappings" element={<ShopifyMappingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
