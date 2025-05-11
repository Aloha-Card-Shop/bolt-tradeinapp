
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import AdminPage from './pages/admin/AdminPage';
import AdminCustomers from './pages/admin/customers';
import AdminUsers from './pages/admin/users';
import TradeValues from './pages/admin/trade-values';
import PrintersAdmin from './pages/admin/printers';
import BarcodesAdmin from './pages/admin/barcodes';
import ManagerDashboard from './pages/dashboard/manager';
import MainApp from './components/MainApp';
import MyTradeIns from './pages/my-trade-ins';
import AdminNav from './components/AdminNav';
import AuthGuard from './components/AuthGuard';
import HomeNavigation from './components/common/HomeNavigation';
import { useSession } from './hooks/useSession';

function App() {
  const { user, loading } = useSession();
  const userRole = user?.user_metadata?.role || 'user';

  return (
    <Router>
      <Toaster position="top-center" />
      
      {!loading && user && (userRole === 'admin' || userRole === 'manager') && (
        <AdminNav userRole={userRole as 'admin' | 'manager' | 'user'} />
      )}
      
      {/* Add HomeNavigation for authenticated users */}
      {!loading && user && userRole && userRole !== 'admin' && userRole !== 'manager' && (
        <HomeNavigation />
      )}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <AuthGuard allowedRoles={['admin', 'manager', 'user']}>
            <Dashboard />
          </AuthGuard>
        } />

        <Route path="/my-trade-ins" element={
          <AuthGuard allowedRoles={['admin', 'manager', 'user']}>
            <MyTradeIns />
          </AuthGuard>
        } />
        
        <Route path="/dashboard/manager" element={
          <AuthGuard allowedRoles={['admin', 'manager']}>
            <ManagerDashboard />
          </AuthGuard>
        } />
        
        <Route path="/admin" element={
          <AuthGuard allowedRoles={['admin']}>
            <AdminPage />
          </AuthGuard>
        } />
        
        <Route path="/admin/customers" element={
          <AuthGuard allowedRoles={['admin', 'manager']}>
            <AdminCustomers />
          </AuthGuard>
        } />
        
        <Route path="/admin/users" element={
          <AuthGuard allowedRoles={['admin']}>
            <AdminUsers />
          </AuthGuard>
        } />

        <Route path="/admin/trade-values" element={
          <AuthGuard allowedRoles={['admin']}>
            <TradeValues />
          </AuthGuard>
        } />
        
        <Route path="/admin/printers" element={
          <AuthGuard allowedRoles={['admin', 'manager']}>
            <PrintersAdmin />
          </AuthGuard>
        } />

        <Route path="/admin/barcodes" element={
          <AuthGuard allowedRoles={['admin']}>
            <BarcodesAdmin />
          </AuthGuard>
        } />
        
        <Route path="/app" element={
          <AuthGuard allowedRoles={['admin', 'manager', 'user']}>
            <MainApp />
          </AuthGuard>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
