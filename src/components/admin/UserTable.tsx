
import React from 'react';
import { Loader2, Trash2, Edit } from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

interface UserTableProps {
  isLoading: boolean;
  staffUsers: StaffUser[];
  onUpdateRole: (userId: string, newRole: 'admin' | 'manager' | 'user') => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onEditUser: (user: StaffUser) => void;
  canEdit?: (role: 'admin' | 'manager' | 'user') => boolean;
  currentViewRole?: 'admin' | 'manager' | 'user';
}

const UserTable: React.FC<UserTableProps> = ({ 
  isLoading, 
  staffUsers, 
  onUpdateRole, 
  onDeleteUser,
  onEditUser,
  canEdit = () => true,
  currentViewRole = 'admin'
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading staff users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email / Username</th>
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
                {staffUser.username && (
                  <p className="text-sm text-gray-500">@{staffUser.username}</p>
                )}
              </td>
              <td className="py-3 px-4">
                {canEdit(staffUser.role) ? (
                  <select
                    value={staffUser.role}
                    onChange={(e) => onUpdateRole(staffUser.id, e.target.value as 'admin' | 'manager' | 'user')}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="px-2 py-1 text-sm capitalize">{staffUser.role}</span>
                )}
              </td>
              <td className="py-3 px-4">
                <p className="text-gray-600">
                  {new Date(staffUser.created_at).toLocaleDateString()}
                </p>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end space-x-2">
                  {canEdit(staffUser.role) && (
                    <>
                      <button
                        onClick={() => onEditUser(staffUser)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(staffUser.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
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
  );
};

export default UserTable;
