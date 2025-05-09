
import React from 'react';
import { getCardNumberString } from '../../utils/cardSearchUtils';

interface CardNumberInputProps {
  cardNumber: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CardNumberInput: React.FC<CardNumberInputProps> = ({ cardNumber, onChange }) => {
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
        placeholder="e.g. 12 or 12/107"
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        Enter full or partial card number (with or without set number)
      </p>
    </div>
  );
};

export default CardNumberInput;
