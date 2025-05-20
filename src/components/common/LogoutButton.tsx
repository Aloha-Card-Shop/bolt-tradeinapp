
import React from 'react';
import { LogOut } from 'lucide-react';
import { useSession } from '../../hooks/useSession';

const LogoutButton: React.FC = () => {
  const { signOut } = useSession();

  return (
    <button
      onClick={signOut}
      className="flex items-center text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
      title="Sign out"
    >
      <LogOut className="h-4 w-4 mr-1" />
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;
