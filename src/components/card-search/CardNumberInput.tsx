
import React, { KeyboardEvent } from 'react';
import { CardNumberObject } from '../../types/card';
import { getCardNumberString } from '../../utils/cardSearchUtils';
import { Loader2 } from 'lucide-react';

interface CardNumberInputProps {
  cardNumber: string | CardNumberObject | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isSearching?: boolean;
}

const CardNumberInput: React.FC<CardNumberInputProps> = ({ 
  cardNumber, 
  onChange,
  onKeyDown,
  isSearching = false
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
      console.log('Search triggered via Enter key in CardNumberInput');
    }
  };
  
  // Get the string value to display for the input
  const displayValue = getCardNumberString(cardNumber);
  
  return (
    <div>
      <label htmlFor="card-number" className="block mb-1 text-sm font-medium text-gray-700">
        Card Number
      </label>
      <div className="relative">
        <input
          id="card-number"
          type="text"
          name="number"
          value={displayValue}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 4, 004, 4/102, or 004/102"
          className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSearching ? 'pr-10' : ''}`}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Enter full or partial card number (works with "4", "004", "4/102", or "004/102")
      </p>
    </div>
  );
};

export default CardNumberInput;
