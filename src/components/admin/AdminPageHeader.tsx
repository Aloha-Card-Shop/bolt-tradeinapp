
import React from 'react';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPageHeaderProps {
  onCreateUser: () => void;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ onCreateUser }) => {
  const navigate = useNavigate();
  
  return (
    <>
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
            onClick={onCreateUser}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Staff User
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminPageHeader;
