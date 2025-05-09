import React from 'react';
import { Loader2 } from 'lucide-react';
import PriceDisplay from '../../trade-in/PriceDisplay';
import MarketPriceInput from './MarketPriceInput';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade';
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice: boolean | undefined;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice?: () => void;
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
}) => {
  return (
    <div className="mt-4 grid md:grid-cols-3 gap-4">
      <MarketPriceInput 
        price={price}
        isLoading={isLoadingPrice}
        onChange={onPriceChange}
        error={error}
        onRefreshPrice={onRefreshPrice}
      />
      
      <PriceDisplay 
        label={paymentType === 'cash' ? 'Cash Value' : 'Trade Value'} 
        value={displayValue} 
        isLoading={isLoading || isLoadingPrice || false}
        error={error}
      />

      <div className="flex items-end">
        {(isLoadingPrice || isLoading) && (
          <div className="text-xs text-blue-600 flex items-center ml-2">
            <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
            Calculating value...
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemValues;
