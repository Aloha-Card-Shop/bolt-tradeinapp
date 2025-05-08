
import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPageHeaderProps {
  onCreateUser?: () => void;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ onCreateUser }) => {
  const navigate = useNavigate();
  
  return (
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
  );
};

export default AdminPageHeader;
