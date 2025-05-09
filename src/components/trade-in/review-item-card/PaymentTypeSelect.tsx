
import React from 'react';
import { PAYMENT_TYPES } from '../../../constants/tradeInConstants';

interface PaymentTypeSelectProps {
  paymentType: 'cash' | 'trade';
  onChange: (paymentType: 'cash' | 'trade') => void;
}

const PaymentTypeSelect: React.FC<PaymentTypeSelectProps> = ({ paymentType, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Payment Type
      </label>
      <select
        value={paymentType}
        onChange={(e) => onChange(e.target.value as 'cash' | 'trade')}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {PAYMENT_TYPES.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PaymentTypeSelect;
