
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import AdminPageContent from '../components/admin/AdminPageContent';
import RoleViewSelector from '../components/admin/RoleViewSelector';
import { useAdminUsers } from '../hooks/useAdminUsers';
import AuthGuard from '../components/AuthGuard';

const AdminPage: React.FC = () => {
  const { staffUsers, isLoading, error, fetchStaffUsers, createUser, updateUser, updateUserRole, deleteUser } = useAdminUsers();
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

  // Fetch staff users when the component mounts
  useEffect(() => {
    fetchStaffUsers();
  }, [fetchStaffUsers]);

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <AdminPageHeader />

          {/* Quick Links Section */}
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-3 text-gray-700">Quick Links</h2>
            <div className="flex flex-wrap gap-2">
              <Link 
                to="/admin/shopify-settings" 
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Shopify Settings
              </Link>
              <Link 
                to="/admin/shopify-mappings" 
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Shopify Mappings
              </Link>
              <Link 
                to="/admin/shopify-logs" 
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Shopify Logs
              </Link>
              {/* Add more admin links here as needed */}
            </div>
          </div>
          
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
    </AuthGuard>
  );
};

export default AdminPage;
