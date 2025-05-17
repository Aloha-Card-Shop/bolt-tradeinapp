
import React from 'react';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import PriceInput from '../shared/PriceInput';
import ValueDisplay from '../shared/ValueDisplay';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade';
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice: boolean | undefined;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice?: () => void;
  isPriceUnavailable?: boolean;
  onValueAdjustment?: (value: number) => void;
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
        <ValueDisplay 
          label={paymentType === 'cash' ? 'Cash Value' : 'Trade Value'} 
          value={displayValue} 
          isLoading={isLoading || isLoadingPrice || false}
          error={error}
          onValueChange={onValueAdjustment}
          editable={!!onValueAdjustment}
        />
        
        {(isLoadingPrice || isLoading) && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-blue-600 flex items-center">
            <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
            Calculating value...
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && error && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> 
            {error}
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && price > 0 && !displayValue && !error && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-orange-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> 
            No value calculated - check market price or trade value settings
          </div>
        )}
        
        {!isLoading && !isLoadingPrice && price > 0 && !error && displayValue > 0 && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-green-600 flex items-center">
            <Info className="h-3 w-3 mr-1" /> 
            Value calculated for {paymentType} payment
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemValues;
