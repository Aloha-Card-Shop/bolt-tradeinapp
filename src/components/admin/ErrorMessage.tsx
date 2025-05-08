
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
};

export default ErrorMessage;
