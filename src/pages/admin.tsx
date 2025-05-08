
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useAdminUsers } from '../hooks/useAdminUsers';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import AdminPageContent from '../components/admin/AdminPageContent';
import RoleViewSelector from '../components/admin/RoleViewSelector';
import { toast } from 'react-hot-toast';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { 
    staffUsers, 
    isLoading, 
    error, 
    fetchStaffUsers, 
    createUser, 
    updateUser,
    updateUserRole, 
    deleteUser 
  } = useAdminUsers();
  
  const [currentViewRole, setCurrentViewRole] = useState<'admin' | 'manager' | 'user'>('admin');
  const [viewPermissions, setViewPermissions] = useState({
    admin: true,
    manager: true,
    user: false
  });
  const [editPermissions, setEditPermissions] = useState({
    admin: true,
    manager: false,
    user: false
  });

  useEffect(() => {
    if (!loading && (!user || user.user_metadata.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }

    if (user?.user_metadata.role === 'admin') {
      fetchStaffUsers();
    }
  }, [user, loading, navigate, fetchStaffUsers]);

  const handleRoleChange = (role: 'admin' | 'manager' | 'user') => {
    setCurrentViewRole(role);
    toast.success(`Switched to ${role} view`);
  };

  const handleTogglePermission = (role: 'admin' | 'manager' | 'user', type: 'view' | 'edit', value: boolean) => {
    if (type === 'view') {
      setViewPermissions(prev => ({
        ...prev,
        [role]: value
      }));
      toast.success(`${value ? 'Enabled' : 'Disabled'} view permission for ${role}`);
    } else {
      setEditPermissions(prev => ({
        ...prev,
        [role]: value
      }));
      toast.success(`${value ? 'Enabled' : 'Disabled'} edit permission for ${role}`);
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
        <AdminPageHeader />
        
        <RoleViewSelector 
          currentRole={currentViewRole}
          onChangeRole={handleRoleChange}
          viewPermissions={viewPermissions}
          editPermissions={editPermissions}
          onTogglePermission={handleTogglePermission}
        />
        
        <AdminPageContent
          staffUsers={staffUsers}
          isLoading={isLoading}
          error={error}
          onUpdateRole={updateUserRole}
          onDeleteUser={deleteUser}
          onCreateUser={createUser}
          onUpdateUser={updateUser}
          currentViewRole={currentViewRole}
          viewPermissions={viewPermissions}
          editPermissions={editPermissions}
        />
      </div>
    </div>
  );
};

export default AdminPage;
