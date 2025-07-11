
import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { VariantOption as VariantOptionType } from './types';

interface VariantOptionProps {
  variant: VariantOptionType;
  isLoading: boolean;
  onToggle: (key: string, toggleFn: () => void) => void;
}

const VariantOption: React.FC<VariantOptionProps> = ({ variant, isLoading, onToggle }) => {
  return (
    <button
      type="button"
      onClick={() => !isLoading && onToggle(variant.key, variant.onToggle)}
      disabled={isLoading}
      className={`
        toggle-option w-full text-left
        ${variant.isActive ? 'toggle-option-active' : 'toggle-option-inactive'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md focus:ring-2 focus:ring-primary/20'}
        focus:outline-none
      `}
      title={`Select ${variant.label}`}
      aria-pressed={variant.isActive}
      role="switch"
    >
      <div className="flex items-center justify-between w-full">
        <span className={`text-sm font-medium transition-colors ${
          variant.isActive ? 'text-primary' : 'text-foreground'
        }`}>
          {variant.label}
        </span>
        
        <div className="flex items-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : variant.isActive ? (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              <Check className="h-4 w-4 text-primary" />
            </div>
          ) : (
            <div className="h-2 w-2 bg-border rounded-full" />
          )}
        </div>
      </div>
    </button>
  );
};

export default VariantOption;
