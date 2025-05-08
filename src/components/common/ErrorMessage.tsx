
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      <p className="ml-3 text-sm text-red-700">{message}</p>
    </div>
  );
};

export default ErrorMessage;
