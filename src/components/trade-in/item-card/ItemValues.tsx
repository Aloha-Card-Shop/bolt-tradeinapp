
import React from 'react';
import PriceDisplay from '../PriceDisplay';
import MarketPriceInput from './MarketPriceInput';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade';
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice?: boolean;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ItemValues: React.FC<ItemValuesProps> = ({ 
  price, 
  paymentType, 
  displayValue,
  isLoading,
  isLoadingPrice,
  error,
  onPriceChange
}) => {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {/* Editable Market Price */}
      <MarketPriceInput
        price={price}
        isLoading={isLoadingPrice || false}
        error={error}
        onChange={onPriceChange}
      />
      
      {/* Trade/Cash Value */}
      <PriceDisplay
        label={paymentType === 'cash' ? 'Cash Value' : 'Trade Value'}
        isLoading={isLoading || isLoadingPrice || false}
        error={error}
        value={displayValue}
      />
    </div>
  );
};

export default ItemValues;
