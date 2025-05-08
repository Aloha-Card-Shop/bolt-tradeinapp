
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, AlertCircle, UserPlus, Trash2, X } from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';
import { getSupabaseUrl, getAuthToken } from '../../lib/supabaseHelpers';

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

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
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
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      await fetchStaffUsers();
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', role: 'user' });
      setError(null);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
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
      setError(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
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

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
              <p className="mt-4 text-gray-600">Loading staff users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffUsers.map(staffUser => (
                    <tr key={staffUser.id}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{staffUser.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={staffUser.role}
                          onChange={(e) => handleUpdateRole(staffUser.id, e.target.value as 'admin' | 'manager' | 'user')}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-600">
                          {new Date(staffUser.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDeleteUser(staffUser.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {staffUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No staff users found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Staff User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Staff User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', password: '', role: 'user' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'manager' | 'user' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: '', password: '', role: 'user' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
