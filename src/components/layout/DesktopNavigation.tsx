
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from 'lucide-react';

interface DesktopNavigationProps {
  userRole: string;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ userRole }) => {
  return (
    <div className="hidden md:flex space-x-4">
      <Link 
        to="/app" 
        className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
      >
        Trade-In App
      </Link>
      
      <Link 
        to="/my-trade-ins" 
        className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
      >
        My Trade-Ins
      </Link>

      {userRole === 'admin' && (
        <Link 
          to="/admin" 
          className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Layout className="h-5 w-5 mr-1 inline" />
          Admin Settings
        </Link>
      )}
    </div>
  );
};

export default DesktopNavigation;
