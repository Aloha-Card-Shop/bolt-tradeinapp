
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-float mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      <p className="text-lg text-muted-foreground animate-pulse font-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
