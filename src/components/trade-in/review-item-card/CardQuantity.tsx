
import React from 'react';

interface CardQuantityProps {
  quantity: number;
  onChange: (quantity: number) => void;
}

const CardQuantity: React.FC<CardQuantityProps> = ({ quantity, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quantity
      </label>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
};

export default CardQuantity;
