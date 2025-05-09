
import React from 'react';

interface MarketPriceInputProps {
  price: number;
  isLoading: boolean;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MarketPriceInput: React.FC<MarketPriceInputProps> = ({ 
  price,
  isLoading,
  error,
  onChange
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Market Price
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500">$</span>
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={onChange}
          disabled={isLoading}
          className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default MarketPriceInput;
