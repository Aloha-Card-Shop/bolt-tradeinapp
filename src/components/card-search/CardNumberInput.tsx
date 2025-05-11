
import React, { KeyboardEvent } from 'react';
import { CardNumberObject } from '../../types/card';
import { getCardNumberString } from '../../utils/cardSearchUtils';

interface CardNumberInputProps {
  cardNumber: string | CardNumberObject | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const CardNumberInput: React.FC<CardNumberInputProps> = ({ 
  cardNumber, 
  onChange,
  onKeyDown 
}) => {
  // Handle Enter key press - default behavior is to trigger search
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // If custom onKeyDown prop is provided, use that
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    
    // Otherwise handle Enter key press with default behavior
    if (e.key === 'Enter') {
      e.preventDefault();
      // The input change handler in useCardSearch already triggers search
    }
  };
  
  return (
    <div>
      <label htmlFor="card-number" className="block mb-1 text-sm font-medium text-gray-700">
        Card Number
      </label>
      <input
        id="card-number"
        type="text"
        name="number"
        value={getCardNumberString(cardNumber)}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="e.g. 12, 12/107, or SW123"
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        Enter full or partial card number (works with just digits, with set number, or prefix)
      </p>
    </div>
  );
};

export default CardNumberInput;
