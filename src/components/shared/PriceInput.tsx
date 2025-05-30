
import React from 'react';
import { DollarSign, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PriceInputProps {
  price: number;
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  onRefreshPrice?: () => void;
  isPriceUnavailable?: boolean;
  label?: string;
  readOnly?: boolean;
}

const PriceInput: React.FC<PriceInputProps> = ({ 
  price, 
  isLoading, 
  onChange, 
  error,
  onRefreshPrice,
  isPriceUnavailable,
  label = "Market Price",
  readOnly = false
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
        {!readOnly && onRefreshPrice && (
          <button 
            onClick={onRefreshPrice}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center mb-1"
            title="Fetch new price"
            type="button"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh
          </button>
        )}
      </div>
      
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="number"
          value={price ? formatCurrency(price) : ''}
          onChange={onChange}
          min="0"
          step="0.01"
          className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
            error ? 'border-red-300 bg-red-50' : 
            isPriceUnavailable ? 'border-yellow-300 bg-yellow-50' : 
            'border-gray-300'
          }`}
          placeholder="0.00"
          disabled={isLoading || readOnly}
          readOnly={readOnly}
        />
        
        {isPriceUnavailable && !error && (
          <div className="mt-1 text-xs text-yellow-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Enter price manually</span>
          </div>
        )}
        
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PriceInput;
