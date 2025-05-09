
import React from 'react';
import { DollarSign, Loader2, RefreshCw } from 'lucide-react';

interface MarketPriceInputProps {
  price: number;
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  onRefreshPrice?: () => void;
}

const MarketPriceInput: React.FC<MarketPriceInputProps> = ({ 
  price, 
  isLoading, 
  onChange, 
  error,
  onRefreshPrice
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Market Price
        </label>
        {onRefreshPrice && (
          <button 
            onClick={onRefreshPrice}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
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
          value={price || ''}
          onChange={onChange}
          min="0"
          step="0.01"
          className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          placeholder="0.00"
          disabled={isLoading}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default MarketPriceInput;
