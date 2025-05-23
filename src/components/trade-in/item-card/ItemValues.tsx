
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { ExternalLink, RefreshCcw } from 'lucide-react';
import PriceInput from '../shared/PriceInput';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade' | null;
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice?: boolean;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice: () => void;
  isPriceUnavailable?: boolean;
  // Renamed to avoid unused variable warning
  onValueAdjustment?: (value: number) => void; 
  usedFallback?: boolean;
  fallbackReason?: string;
  isCertified?: boolean;
  priceSource?: {
    name: string;
    url: string;
    salesCount: number;
    foundSales: boolean;
  };
}

const ItemValues: React.FC<ItemValuesProps> = ({
  price,
  paymentType,
  displayValue,
  isLoading,
  isLoadingPrice,
  error,
  onPriceChange,
  onRefreshPrice,
  isPriceUnavailable,
  // Renamed with underscore to indicate it's not used
  onValueAdjustment: _onValueAdjustment,
  usedFallback,
  fallbackReason,
  isCertified,
  priceSource
}) => {
  const isDisabled = isLoading || isLoadingPrice;
  
  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mr-2">
            Market Price:
          </label>
          <button
            onClick={onRefreshPrice}
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            disabled={isDisabled}
            title="Refresh price"
          >
            <RefreshCcw className="h-3 w-3" />
          </button>
        </div>
        <div className="w-32">
          <PriceInput
            price={price}
            onChange={onPriceChange}
            error={error}
            isPriceUnavailable={isPriceUnavailable}
            disabled={isDisabled}
          />
        </div>
      </div>
      
      {priceSource && isCertified && (
        <div className="text-xs text-gray-500 flex items-center">
          <span>Source: </span>
          <a 
            href={priceSource.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center text-blue-600 hover:underline ml-1"
          >
            {priceSource.name} 
            <ExternalLink className="h-3 w-3 ml-0.5" />
          </a>
          {priceSource.foundSales && (
            <span className="ml-1">({priceSource.salesCount} sales)</span>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {paymentType === 'cash' ? 'Cash Value:' : 'Trade Value:'}
        </label>
        <div className={`text-xl font-bold ${isLoading ? 'opacity-50' : 'text-green-600'}`}>
          {isLoading ? (
            <div className="animate-pulse w-16 h-6 bg-gray-200 rounded"></div>
          ) : (
            <>${formatCurrency(displayValue)}</>
          )}
        </div>
      </div>

      {usedFallback && fallbackReason && (
        <div className="text-xs text-amber-600">
          Using fallback value calculation: {fallbackReason}
        </div>
      )}
    </div>
  );
};

export default ItemValues;
