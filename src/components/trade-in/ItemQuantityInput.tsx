
import React from 'react';

interface ItemQuantityInputProps {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
}

const ItemQuantityInput: React.FC<ItemQuantityInputProps> = ({ value, onChange, id }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        Quantity
      </label>
      <input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
};

export default ItemQuantityInput;
