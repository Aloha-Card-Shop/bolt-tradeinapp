
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingDisplayProps {
  message?: string;
}

const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ message = "Searching cards..." }) => {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingDisplay;
