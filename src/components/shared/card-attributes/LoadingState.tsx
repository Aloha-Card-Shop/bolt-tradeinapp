
import React from 'react';
import { Loader2, Package } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-foreground">
        Card Type
        <Loader2 className="ml-2 h-3 w-3 animate-spin text-primary" />
      </label>
      <div className="card-base p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="relative">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div className="absolute inset-0 animate-pulse">
              <Package className="h-5 w-5 text-primary opacity-30" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-foreground">Loading variants...</span>
            <div className="flex space-x-1">
              <div className="h-1 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
