
import React from 'react';
import { DollarSign, Tag } from 'lucide-react';

interface PaymentTypeBadgeProps {
  paymentType: string;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentTypeBadge: React.FC<PaymentTypeBadgeProps> = ({ 
  paymentType, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getPaymentTypeData = (paymentType: string) => {
    switch (paymentType?.toLowerCase()) {
      case 'cash':
        return {
          icon: <DollarSign className={iconSizes[size]} />,
          bgClass: 'bg-success-light',
          textClass: 'text-success',
          borderClass: 'border-success-border'
        };
      case 'trade':
        return {
          icon: <Tag className={iconSizes[size]} />,
          bgClass: 'bg-warning-light',
          textClass: 'text-warning',
          borderClass: 'border-warning-border'
        };
      case 'mixed':
        return {
          icon: (
            <div className="flex items-center gap-1">
              <DollarSign className={iconSizes[size]} />
              <Tag className={iconSizes[size]} />
            </div>
          ),
          bgClass: 'bg-info-light',
          textClass: 'text-info',
          borderClass: 'border-info-border'
        };
      default:
        return {
          icon: <DollarSign className={iconSizes[size]} />,
          bgClass: 'bg-muted',
          textClass: 'text-muted-foreground',
          borderClass: 'border-border'
        };
    }
  };

  const { icon, bgClass, textClass, borderClass } = getPaymentTypeData(paymentType);

  return (
    <span className={`
      inline-flex items-center gap-2 font-medium rounded-full border
      transition-all duration-200 ${sizeClasses[size]}
      ${bgClass} ${textClass} ${borderClass}
    `}>
      {icon}
      <span className="capitalize">{paymentType || 'cash'}</span>
    </span>
  );
};

export default PaymentTypeBadge;
