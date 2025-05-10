
import React from 'react';
import { AlertCircle, Database } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  isSchemaError?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, isSchemaError = false }) => {
  return (
    <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
      {isSchemaError ? (
        <Database className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="ml-3">
        <p className="text-sm text-red-700">{message}</p>
        {isSchemaError && (
          <p className="text-xs text-red-600 mt-1">
            This appears to be a database schema error. Please try a different search or contact support.
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
