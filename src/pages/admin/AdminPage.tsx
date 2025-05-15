
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, UserPlus, Home, Settings, ClipboardList, UserCircle, DollarSign, Barcode, Printer, ShoppingCart, Map } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useAdminApi } from '../../components/AdminWrapper';
import UserTable from '../../components/admin/UserTable';
import CreateUserModal from '../../components/admin/CreateUserModal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ErrorMessage from '../../components/admin/ErrorMessage';
import EditUserModal from '../../components/admin/EditUserModal';

interface StaffUser {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

interface NewStaffUser {
  email?: string;
  password: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const adminApi = useAdminApi();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StaffUser | null>(null);
  const [newUser, setNewUser] = useState<NewStaffUser>({
    email: '',
    password: '',
    username: '',
    role: 'user'
  });

  useEffect(() => {
    if (!loading && (!user || user.user_metadata.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }

    if (user?.user_metadata.role === 'admin') {
      fetchStaffUsers();
    }
  }, [user, loading, navigate]);

  const fetchStaffUsers = async () => {
    setIsLoading(true);
    try {
      const { users } = await adminApi.listUsers();
      setStaffUsers(users.map((u: any) => ({
        id: u.id,
        email: u.email,
        username: u.user_metadata?.username || null,
        role: u.user_metadata?.role || 'user',
        created_at: u.created_at
      })));
      setError(null);
    } catch (error) {
      console.error('Error fetching staff users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load staff users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      await fetchStaffUsers();
      handleCloseModal();
      setError(null);
      return;
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
      return;
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'user'): Promise<boolean> => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setStaffUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setError(null);
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user role');
      return false;
    }
  };

  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this staff user?')) {
      return false;
    }

    try {
      await adminApi.deleteUser(userId);
      setStaffUsers(prev => prev.filter(user => user.id !== userId));
      setError(null);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      return false;
    }
  };
  
  const handleEditUser = (user: StaffUser) => {
    setUserToEdit(user);
  };

  const handleUpdateUser = async (userId: string, userData: { username?: string; role: 'admin' | 'manager' | 'user' }) => {
    try {
      await adminApi.updateUser(userId, userData);
      setStaffUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
      setError(null);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
      return false;
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewUser({ email: '', password: '', username: '', role: 'user' });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Admin Nav Bar - Similar to AdminNav component */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 overflow-x-auto">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>

              <Link
                to="/admin/customers"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Customers
              </Link>

              <Link
                to="/dashboard/manager"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Trade-Ins
              </Link>

              <Link
                to="/admin/shopify-settings"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopify Settings
              </Link>

              <Link
                to="/admin/shopify-mappings"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50"
              >
                <Map className="h-4 w-4 mr-2" />
                Shopify Mappings
              </Link>

              <Link
                to="/admin/trade-values"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Trade Values
              </Link>

              <Link
                to="/admin/barcodes"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <Barcode className="h-4 w-4 mr-2" />
                Barcodes
              </Link>

              <Link
                to="/admin/printers"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Printers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdminPageHeader />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Staff Users</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Staff User
            </button>
          </div>

          <ErrorMessage message={error} />
          
          <UserTable 
            isLoading={isLoading}
            staffUsers={staffUsers}
            onUpdateRole={handleUpdateRole}
            onDeleteUser={handleDeleteUser}
            onEditUser={handleEditUser}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          newUser={newUser}
          onUserChange={setNewUser}
          onSubmit={handleCreateUser}
          onClose={handleCloseModal}
        />
      )}

      {userToEdit && (
        <EditUserModal
          user={userToEdit}
          onSave={handleUpdateUser}
          onClose={() => setUserToEdit(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
