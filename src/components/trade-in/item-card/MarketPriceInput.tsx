
import React from 'react';
import PriceInput from '../shared/PriceInput';

interface MarketPriceInputProps {
  price: number;
  isLoading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  onRefreshPrice?: () => void;
  isPriceUnavailable?: boolean;
  disabled?: boolean; // Add the missing disabled prop
}

const MarketPriceInput: React.FC<MarketPriceInputProps> = (props) => {
  return <PriceInput {...props} />;
};

export default MarketPriceInput;
