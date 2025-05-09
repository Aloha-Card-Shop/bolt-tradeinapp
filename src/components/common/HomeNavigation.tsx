
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const HomeNavigation: React.FC = () => {
  return (
    <div className="bg-white shadow-sm py-2 px-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-start">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Home className="h-5 w-5 mr-2" />
          Dashboard
        </Link>
      </div>
    </div>
  );
};

export default HomeNavigation;
