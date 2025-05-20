
import React from 'react';
import { AlertCircle, Database, Calculator, AlertTriangle } from 'lucide-react';

type ErrorType = 'general' | 'database' | 'calculation' | 'auth' | 'validation' | 'network';

interface ErrorMessageProps {
  message: string;
  type?: ErrorType;
  details?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  type = 'general',
  details,
  showIcon = true
}) => {
  // Helper to get the appropriate icon based on error type
  const getIcon = () => {
    switch (type) {
      case 'database':
        return <Database className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
      case 'calculation':
        return <Calculator className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
      case 'validation':
        return <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
      case 'general':
      default:
        return <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
    }
  };

  return (
    <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-start" role="alert">
      {showIcon && getIcon()}
      <div className={showIcon ? "ml-3" : ""}>
        <p className="text-sm text-red-700">{message}</p>
        {details && (
          <p className="text-xs text-red-600 mt-1">{details}</p>
        )}
        {type === 'calculation' && (
          <p className="text-xs text-red-600 mt-1">
            Fallback values have been applied. Please check the trade value settings.
          </p>
        )}
        {type === 'database' && (
          <p className="text-xs text-red-600 mt-1">
            This appears to be a database issue. Please try again later or contact support.
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
