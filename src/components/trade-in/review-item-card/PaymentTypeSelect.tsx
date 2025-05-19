
import React from 'react';
import { DollarSign, Tag } from 'lucide-react';

interface PaymentTypeSelectProps {
  paymentType: 'cash' | 'trade' | null;
  onChange: (type: 'cash' | 'trade') => void;
}

const PaymentTypeSelect: React.FC<PaymentTypeSelectProps> = ({ paymentType, onChange }) => {
  console.log('PaymentTypeSelect rendering with payment type:', paymentType);
  
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Type</label>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange('cash')}
          className={`flex items-center justify-center px-3 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
            paymentType === 'cash'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          Cash
        </button>
        <button
          type="button"
          onClick={() => onChange('trade')}
          className={`flex items-center justify-center px-3 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
            paymentType === 'trade'
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Tag className="h-3 w-3 mr-1" />
          Trade
        </button>
      </div>
      
      {paymentType === null && (
        <div className="absolute bottom-[-20px] left-0 text-xs text-blue-600">
          Please select a payment type
        </div>
      )}
    </div>
  );
};

export default PaymentTypeSelect;
