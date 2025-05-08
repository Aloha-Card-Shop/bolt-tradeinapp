
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { getSupabaseUrl, getAuthToken } from '../lib/supabaseHelpers';
import UserTable from '../components/admin/UserTable';
import CreateUserModal from '../components/admin/CreateUserModal';
import { toast } from 'react-hot-toast';

interface StaffUser {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

interface NewStaffUser {
  email: string;
  password: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      const supabaseUrl = getSupabaseUrl();
      const authToken = await getAuthToken();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/list-users`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff users');
      }

      const { users } = await response.json();
      setStaffUsers(users.map((u: any) => ({
        id: u.id,
        email: u.email,
        username: u.user_metadata?.username || null,
        role: u.user_metadata?.role || 'user',
        created_at: u.created_at
      })));
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
      const supabaseUrl = getSupabaseUrl();
      const authToken = await getAuthToken();
      
      // Prepare user data, optionally including username if provided
      const userData = { ...newUser };
      if (!userData.username) {
        delete userData.username; // Remove empty username from payload
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      await fetchStaffUsers();
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', username: '', role: 'user' });
      setError(null);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
      toast.error('Failed to create user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      const supabaseUrl = getSupabaseUrl();
      const authToken = await getAuthToken();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/update-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }

      setStaffUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
      setError(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user role');
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff user?')) {
      return;
    }

    try {
      const supabaseUrl = getSupabaseUrl();
      const authToken = await getAuthToken();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setStaffUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      setError(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      toast.error('Failed to delete user');
    }
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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          </div>
        </div>

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

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <UserTable 
            isLoading={isLoading}
            staffUsers={staffUsers}
            onUpdateRole={handleUpdateRole}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      </div>

      {/* Create Staff User Modal */}
      {showCreateModal && (
        <CreateUserModal
          newUser={newUser}
          onUserChange={setNewUser}
          onSubmit={handleCreateUser}
          onClose={() => {
            setShowCreateModal(false);
            setNewUser({ email: '', password: '', username: '', role: 'user' });
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;
