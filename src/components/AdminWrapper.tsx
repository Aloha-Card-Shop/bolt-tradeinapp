
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseUrl, getAuthToken } from '../lib/supabaseHelpers';

// Proxy component that makes admin API calls with proper URL access
export const useAdminApi = () => {
  const supabaseUrl = getSupabaseUrl();
  
  const listUsers = async () => {
    const authToken = await getAuthToken();
    if (!authToken) throw new Error('Authentication required');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/list-users`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  };
  
  const createUser = async (userData: any) => {
    const authToken = await getAuthToken();
    if (!authToken) throw new Error('Authentication required');
    
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
    
    return await response.json();
  };
  
  const updateUserRole = async (userId: string, role: string) => {
    const authToken = await getAuthToken();
    if (!authToken) throw new Error('Authentication required');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/update-user-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId, role })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user role');
    }
    
    return await response.json();
  };
  
  const deleteUser = async (userId: string) => {
    const authToken = await getAuthToken();
    if (!authToken) throw new Error('Authentication required');
    
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
    
    return await response.json();
  };
  
  return {
    listUsers,
    createUser,
    updateUserRole,
    deleteUser
  };
};
