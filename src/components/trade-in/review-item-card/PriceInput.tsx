
import React from 'react';
import { DollarSign } from 'lucide-react';

interface PriceInputProps {
  price: number;
  onChange: (price: number) => void;
  error?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({ price, onChange, error }) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onChange(newPrice);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Market Price
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={handlePriceChange}
          className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PriceInput;
