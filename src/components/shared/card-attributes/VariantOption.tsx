
import React from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { VariantOption as VariantOptionType } from './types';

interface VariantOptionProps {
  variant: VariantOptionType;
  isLoading: boolean;
  onToggle: (key: string, toggleFn: () => void) => void;
}

const VariantOption: React.FC<VariantOptionProps> = ({ variant, isLoading, onToggle }) => {
  return (
    <div 
      key={variant.key}
      onClick={() => onToggle(variant.key, variant.onToggle)}
      className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
        variant.isActive 
          ? 'bg-blue-50 border-2 border-blue-200' 
          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={`Select ${variant.label}`}
    >
      <span className={`text-sm font-medium ${
        variant.isActive ? 'text-blue-700' : 'text-gray-700'
      }`}>
        {variant.label}
      </span>
      {isLoading ? (
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      ) : variant.isActive ? (
        <ToggleRight className={`h-5 w-5 text-${variant.color}`} />
      ) : (
        <ToggleLeft className="h-5 w-5 text-gray-400" />
      )}
    </div>
  );
};

export default VariantOption;
