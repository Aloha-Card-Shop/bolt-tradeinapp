
import React from 'react';
import { RefreshCcw, DollarSign, AlertTriangle } from 'lucide-react';
import MarketPriceInput from './MarketPriceInput';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade' | null;
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice?: boolean;
  error?: string;
  isPriceUnavailable?: boolean;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice: () => void;
  onValueAdjustment?: (value: number) => void;
  usedFallback?: boolean;
  fallbackReason?: string;
  isCertified?: boolean;
}

const ItemValues: React.FC<ItemValuesProps> = ({
  price,
  paymentType,
  displayValue,
  isLoading,
  isLoadingPrice,
  error,
  isPriceUnavailable,
  onPriceChange,
  onRefreshPrice,
  onValueAdjustment,
  usedFallback,
  fallbackReason,
  isCertified = false
}) => {
  return (
    <div className="mt-4 relative">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700">Market Price</label>
          </div>
          <div className="relative">
            <MarketPriceInput
              value={price}
              onChange={onPriceChange}
              disabled={isLoadingPrice}
            />
            <button
              onClick={onRefreshPrice}
              disabled={isLoadingPrice}
              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-blue-500 disabled:opacity-50"
              title="Refresh price"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {isPriceUnavailable && (
            <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              No market price available
            </p>
          )}
          {usedFallback && (
            <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {fallbackReason || 'Using fallback pricing'}
            </p>
          )}
        </div>
        
        <div>
          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700">
              {paymentType === 'cash' ? 'Cash Value' : 
               paymentType === 'trade' ? 'Trade Value' : 
               'Select Payment Type'}
            </label>
          </div>
          <div className="relative">
            <div className={`
              flex items-center h-10 px-3 border rounded-md bg-gray-50 
              ${!paymentType ? 'text-gray-400 italic' : 'text-gray-900 font-medium'} 
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}>
              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
              {isLoading ? (
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : paymentType ? (
                <span 
                  className={`${isCertified ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={() => {
                    // Only enable manual adjustment for certified cards
                    if (isCertified && onValueAdjustment) {
                      onValueAdjustment(displayValue);
                    }
                  }}
                >
                  {displayValue.toFixed(2)}
                </span>
              ) : (
                <span>Select payment type</span>
              )}
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemValues;
