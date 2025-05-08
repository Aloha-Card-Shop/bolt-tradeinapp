
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useAdminUsers } from '../hooks/useAdminUsers';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import AdminPageContent from '../components/admin/AdminPageContent';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { 
    staffUsers, 
    isLoading, 
    error, 
    fetchStaffUsers, 
    createUser, 
    updateUserRole, 
    deleteUser 
  } = useAdminUsers();

  useEffect(() => {
    if (!loading && (!user || user.user_metadata.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }

    if (user?.user_metadata.role === 'admin') {
      fetchStaffUsers();
    }
  }, [user, loading, navigate, fetchStaffUsers]);

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
        <AdminPageHeader />
        <AdminPageContent
          staffUsers={staffUsers}
          isLoading={isLoading}
          error={error}
          onUpdateRole={updateUserRole}
          onDeleteUser={deleteUser}
          onCreateUser={createUser}
        />
      </div>
    </div>
  );
};

export default AdminPage;
