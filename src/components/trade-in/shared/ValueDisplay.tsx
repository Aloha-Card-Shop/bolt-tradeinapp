
import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface ValueDisplayProps {
  label: string;
  value: number;
  isLoading?: boolean;
  error?: string;
  quantity?: number;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ 
  label, 
  value, 
  isLoading = false,
  error,
  quantity = 1
}) => {
  const displayValue = quantity * value;
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        <div className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
          {isLoading ? (
            <span className="text-gray-500">Calculating...</span>
          ) : error ? (
            <span className="text-red-500 text-xs">{error}</span>
          ) : (
            formatCurrency(displayValue)
          )}
        </div>
      </div>
    </div>
  );
};

export default ValueDisplay;
