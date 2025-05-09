
import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface ValueDisplayProps {
  value?: number;
  quantity: number;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ value = 0, quantity }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Value
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          value={formatCurrency((value || 0) * quantity)}
          readOnly
          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
        />
      </div>
    </div>
  );
};

export default ValueDisplay;
