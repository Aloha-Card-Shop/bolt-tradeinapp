
import { useState } from 'react';
import { getSupabaseUrl, getAuthToken } from '../lib/supabaseHelpers';
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

export const useAdminUsers = () => {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (error) {
      console.error('Error fetching staff users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load staff users');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (newUser: NewStaffUser) => {
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
      setError(null);
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
      toast.error('Failed to create user');
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
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
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user role');
      toast.error('Failed to update user role');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff user?')) {
      return false;
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
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      toast.error('Failed to delete user');
      return false;
    }
  };

  return {
    staffUsers,
    isLoading,
    error,
    fetchStaffUsers,
    createUser,
    updateUserRole,
    deleteUser
  };
};
