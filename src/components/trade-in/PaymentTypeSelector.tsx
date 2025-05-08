
import React from 'react';

interface PaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade';
  onSelect: (type: 'cash' | 'trade') => void;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({ paymentType, onSelect }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Payment Type
      </label>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onSelect('cash')}
          className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
            paymentType === 'cash'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cash
        </button>
        <button
          type="button"
          onClick={() => onSelect('trade')}
          className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
            paymentType === 'trade'
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Trade
        </button>
      </div>
    </div>
  );
};

export default PaymentTypeSelector;
