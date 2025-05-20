
import React from 'react';
import { AlertCircle, DatabaseIcon, ShieldAlert } from 'lucide-react';

interface ErrorDisplayProps {
  message: string | null;
  type?: 'general' | 'database' | 'calculation' | 'auth';
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message, 
  type = 'general',
  className = '' 
}) => {
  if (!message) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'database':
        return <DatabaseIcon className="h-5 w-5 text-red-600 mr-2" />;
      case 'auth':
        return <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />;
      case 'calculation':
      case 'general':
      default:
        return <AlertCircle className="h-5 w-5 text-red-600 mr-2" />;
    }
  };
  
  const getHeading = () => {
    switch (type) {
      case 'database':
        return 'Database Error';
      case 'auth':
        return 'Authentication Error';
      case 'calculation':
        return 'Calculation Error';
      case 'general':
      default:
        return 'Error';
    }
  };
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm mb-4 ${className}`} role="alert">
      <div className="flex items-start">
        {getIcon()}
        <div>
          <p className="font-bold">{getHeading()}</p>
          <p className="text-sm">{message}</p>
          
          {type === 'calculation' && (
            <p className="text-xs mt-1 text-red-500">
              Using fallback values. Please check again later or contact support if this persists.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
