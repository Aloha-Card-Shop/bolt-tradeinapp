
import React from 'react';
import { DollarSign, Tag } from 'lucide-react';

interface PaymentTypeBadgeProps {
  paymentType: string;
}

const PaymentTypeBadge: React.FC<PaymentTypeBadgeProps> = ({ paymentType }) => {
  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'trade':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'mixed':
        return (
          <div className="flex">
            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
            <Tag className="h-4 w-4 text-blue-500" />
          </div>
        );
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <span className="relative inline-block px-3 py-1 font-semibold text-gray-900 leading-tight">
      <span aria-hidden className="absolute inset-0 bg-gray-200 opacity-50 rounded-full"></span>
      <span className="relative flex items-center space-x-1">
        {getPaymentTypeIcon(paymentType || 'cash')}
        <span className="capitalize">{paymentType || 'cash'}</span>
      </span>
    </span>
  );
};

export default PaymentTypeBadge;
