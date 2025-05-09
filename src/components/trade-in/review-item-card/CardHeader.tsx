
import React from 'react';
import { X } from 'lucide-react';
import { CardNumberObject } from '../../../types/card';

interface CardHeaderProps {
  name: string;
  number?: string | CardNumberObject;
  set?: string;
  onRemove: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ name, number, set, onRemove }) => {
  // Helper function to safely get string from card number
  const getCardNumberString = (cardNumber: string | CardNumberObject | undefined): string => {
    if (!cardNumber) return '';
    
    if (typeof cardNumber === 'object') {
      return cardNumber.displayName || cardNumber.value || '';
    }
    
    return cardNumber;
  };

  return (
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-medium text-gray-900">
          {name}
          {number && (
            <span className="ml-2 text-sm text-gray-500">#{getCardNumberString(number)}</span>
          )}
        </h4>
        {set && (
          <p className="text-sm text-gray-600">{set}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CardHeader;
