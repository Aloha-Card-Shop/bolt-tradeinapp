
import React from 'react';
import { X } from 'lucide-react';

interface ClearSearchButtonProps {
  onClear: () => void;
  isDisabled?: boolean;
}

const ClearSearchButton: React.FC<ClearSearchButtonProps> = ({ onClear, isDisabled = false }) => {
  return (
    <button
      onClick={onClear}
      className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
        isDisabled 
          ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-red-600 bg-gray-50'
      }`}
      disabled={isDisabled}
      title="Clear search results"
    >
      <X className="h-4 w-4" />
      <span>Clear</span>
    </button>
  );
};

export default ClearSearchButton;
