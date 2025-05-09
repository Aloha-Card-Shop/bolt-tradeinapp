
import React from 'react';
import { DollarSign, Tag } from 'lucide-react';

interface PaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade';
  onSelect: (type: 'cash' | 'trade') => void;
  disabled?: boolean;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  paymentType,
  onSelect,
  disabled = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Payment Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelect('cash')}
          disabled={disabled}
          className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            paymentType === 'cash'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Cash
        </button>
        
        <button
          type="button"
          onClick={() => onSelect('trade')}
          disabled={disabled}
          className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            paymentType === 'trade'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Tag className="h-4 w-4 mr-2" />
          Trade
        </button>
      </div>
    </div>
  );
};

export default PaymentTypeSelector;
