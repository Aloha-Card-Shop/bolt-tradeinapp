
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
        <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-blue-600" />
      </label>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading variants...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
