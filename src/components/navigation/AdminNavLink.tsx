
import React from 'react';
import { useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface AdminNavLinkProps {
  icon: LucideIcon;
  label: string;
  path: string;
  onClick: () => void;
  activeColor?: string;
  isMobile?: boolean;
}

const AdminNavLink: React.FC<AdminNavLinkProps> = ({ 
  icon: Icon, 
  label, 
  path, 
  onClick, 
  activeColor = 'blue', 
  isMobile = false 
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  // Dynamic color classes based on active state and color prop
  const colorClasses = {
    blue: isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
    red: isActive ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-600 hover:bg-red-50',
    purple: isActive ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50',
    cyan: isActive ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 hover:text-cyan-600 hover:bg-cyan-50',
    indigo: isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50',
    green: isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
        colorClasses[activeColor as keyof typeof colorClasses]
      }${isMobile ? ' w-full' : ''}`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  );
};

export default AdminNavLink;
