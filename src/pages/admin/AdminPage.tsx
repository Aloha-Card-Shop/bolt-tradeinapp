import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useAdminApi } from '../../components/AdminWrapper';
import UserTable from '../../components/admin/UserTable';
import CreateUserModal from '../../components/admin/CreateUserModal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ErrorMessage from '../../components/admin/ErrorMessage';

interface StaffUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

interface NewStaffUser {
  email: string;
  password: string;
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
  const [newUser, setNewUser] = useState<NewStaffUser>({
    email: '',
    password: '',
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUser);
      await fetchStaffUsers();
      handleCloseModal();
      setError(null);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setStaffUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setError(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff user?')) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      setStaffUsers(prev => prev.filter(user => user.id !== userId));
      setError(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };
  
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewUser({ email: '', password: '', role: 'user' });
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <AdminPageHeader onCreateUser={() => setShowCreateModal(true)} />

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
    </div>
  );
};

export default AdminPage;
