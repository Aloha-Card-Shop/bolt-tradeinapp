
import React from 'react';
import { Loader2, AlertCircle, Info, ChevronsDown } from 'lucide-react';
import PriceInput from '../shared/PriceInput';
import ValueDisplay from '../shared/ValueDisplay';
import FallbackWarning from '../FallbackWarning';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade' | null;
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice: boolean | undefined;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice?: () => void;
  isPriceUnavailable?: boolean;
  onValueAdjustment?: (value: number) => void;
  usedFallback?: boolean;
  fallbackReason?: string;
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
  onValueAdjustment,
  usedFallback = false,
  fallbackReason
}) => {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <PriceInput 
        price={price}
        isLoading={isLoadingPrice}
        onChange={onPriceChange}
        error={error}
        onRefreshPrice={onRefreshPrice}
        isPriceUnavailable={isPriceUnavailable}
      />
      
      <div className="relative">
        {paymentType ? (
          <ValueDisplay 
            label={paymentType === 'cash' ? 'Cash Value' : 'Trade Value'} 
            value={displayValue} 
            isLoading={isLoading || isLoadingPrice || false}
            error={error}
            onValueChange={onValueAdjustment}
            editable={!!onValueAdjustment}
            usedFallback={usedFallback}
            fallbackReason={fallbackReason}
          />
        ) : (
          <div className="rounded-md border border-gray-300 p-2 h-full flex flex-col justify-center items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <div className="text-gray-500 text-center p-2">
              <ChevronsDown className="h-5 w-5 mx-auto mb-1 animate-bounce text-blue-500" />
              Select payment type to see value
            </div>
          </div>
        )}
        
        {(isLoadingPrice || isLoading) && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-blue-600 flex items-center">
            <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
            Calculating value...
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && error && error !== 'API_ENDPOINT_NOT_FOUND' && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> 
            {error}
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && price > 0 && !displayValue && !error && paymentType && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-orange-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> 
            No value calculated - check market price or trade value settings
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && price > 0 && !error && displayValue > 0 && paymentType && !usedFallback && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-green-600 flex items-center">
            <Info className="h-3 w-3 mr-1" /> 
            Value calculated for {paymentType} payment
          </div>
        )}
        
        {error === 'API_ENDPOINT_NOT_FOUND' && !isLoading && price > 0 && displayValue > 0 && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-amber-600 flex items-center">
            <Info className="h-3 w-3 mr-1" /> 
            Using estimated values (API not available)
          </div>
        )}
      </div>
      
      {(usedFallback || error === 'API_ENDPOINT_NOT_FOUND') && !isLoading && paymentType && (
        <div className="col-span-2 mt-2">
          <FallbackWarning 
            showWarning={true}
            fallbackReason={fallbackReason || 'API_UNAVAILABLE'}
          />
        </div>
      )}
    </div>
  );
};

export default ItemValues;
