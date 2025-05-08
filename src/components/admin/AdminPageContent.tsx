
import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import ErrorMessage from './ErrorMessage';
import UserTable from './UserTable';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

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

interface UpdateStaffUser {
  username?: string;
  role: 'admin' | 'manager' | 'user';
}

interface AdminPageContentProps {
  staffUsers: StaffUser[];
  isLoading: boolean;
  error: string | null;
  onUpdateRole: (userId: string, newRole: 'admin' | 'manager' | 'user') => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onCreateUser: (user: NewStaffUser) => Promise<boolean>;
  onUpdateUser: (userId: string, userData: UpdateStaffUser) => Promise<boolean>;
}

const AdminPageContent: React.FC<AdminPageContentProps> = ({
  staffUsers,
  isLoading,
  error,
  onUpdateRole,
  onDeleteUser,
  onCreateUser,
  onUpdateUser
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<NewStaffUser>({
    email: '',
    password: '',
    username: '',
    role: 'user'
  });
  const [userToEdit, setUserToEdit] = useState<StaffUser | null>(null);

  const handleCreateUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const success = await onCreateUser(newUser);
    if (success) {
      handleCloseModal();
    }
  };
  
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewUser({ email: '', password: '', username: '', role: 'user' });
  };

  const handleUserChange = (user: NewStaffUser) => {
    setNewUser(user);
  };

  const handleEditUser = (user: StaffUser) => {
    setUserToEdit(user);
  };

  const handleCloseEditModal = () => {
    setUserToEdit(null);
  };

  return (
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
        onUpdateRole={onUpdateRole}
        onDeleteUser={onDeleteUser}
        onEditUser={handleEditUser}
      />

      {showCreateModal && (
        <CreateUserModal
          newUser={newUser}
          onUserChange={handleUserChange}
          onSubmit={handleCreateUser}
          onClose={handleCloseModal}
        />
      )}

      {userToEdit && (
        <EditUserModal
          user={userToEdit}
          onSave={onUpdateUser}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};

export default AdminPageContent;
