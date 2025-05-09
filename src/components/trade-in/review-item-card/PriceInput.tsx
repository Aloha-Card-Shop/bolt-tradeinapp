
import React from 'react';
import SharedPriceInput from '../shared/PriceInput';

interface PriceInputProps {
  price: number;
  onChange: (price: number) => void;
  error?: string;
  isPriceUnavailable?: boolean;
}

const PriceInput: React.FC<PriceInputProps> = ({ 
  price, 
  onChange, 
  error,
  isPriceUnavailable
}) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onChange(newPrice);
  };

  return (
    <SharedPriceInput
      price={price}
      onChange={handlePriceChange}
      error={error}
      isPriceUnavailable={isPriceUnavailable}
    />
  );
};

export default PriceInput;
