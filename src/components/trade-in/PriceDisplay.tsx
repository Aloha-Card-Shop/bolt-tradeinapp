
import React from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PriceDisplayProps {
  label: string;
  isLoading: boolean;
  error?: string;
  value: number | string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ label, isLoading, error, value }) => {
  // Format the value for display
  let displayValue: string;
  
  if (typeof value === 'number') {
    displayValue = formatCurrency(value);
  } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
    displayValue = formatCurrency(parseFloat(value));
  } else {
    displayValue = value as string;
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        <div className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
              <span>{label === 'Market Price' ? 'Loading...' : 'Calculating...'}</span>
            </div>
          ) : error ? (
            <span className="text-red-500 text-xs">{error || 'Error'}</span>
          ) : (
            displayValue || '$0.00'
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay;
