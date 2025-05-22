
import React from 'react';
import LogoutButton from '../common/LogoutButton';

interface UserInfoProps {
  user: any; // Using 'any' to match the existing type in useSession
  userRole: string;
  className?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ user, userRole, className = '' }) => {
  return (
    <div className={`items-center space-x-4 ${className}`}>
      <span className="text-sm text-gray-500">
        {user.email} ({userRole})
      </span>
      <LogoutButton />
    </div>
  );
};

export default UserInfo;
