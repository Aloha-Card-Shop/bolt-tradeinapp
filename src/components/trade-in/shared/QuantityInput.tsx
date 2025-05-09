
import React from 'react';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface QuantityInputProps {
  quantity: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  disabled?: boolean;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  onChange,
  onIncrement,
  onDecrement,
  disabled = false
}) => {
  const handleIncrement = () => {
    if (onIncrement) {
      onIncrement();
    }
  };

  const handleDecrement = () => {
    if (onDecrement && quantity > 1) {
      onDecrement();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quantity
      </label>
      <div className="flex items-center">
        {onDecrement && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || disabled}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <MinusCircle className="h-5 w-5 text-gray-500" />
          </button>
        )}
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {onIncrement && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <PlusCircle className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuantityInput;
