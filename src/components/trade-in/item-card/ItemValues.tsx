
import React from 'react';
import { Loader2 } from 'lucide-react';
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
        />
        
        {(isLoadingPrice || isLoading) && (
          <div className="absolute bottom-[-24px] left-0 text-xs text-blue-600 flex items-center">
            <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
            Calculating value...
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemValues;
