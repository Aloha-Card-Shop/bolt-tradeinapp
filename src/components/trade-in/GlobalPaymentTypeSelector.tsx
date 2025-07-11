
import React from 'react';
import UnifiedPaymentTypeSelector from '../shared/PaymentTypeSelector';

interface GlobalPaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade';
  onSelect: (type: 'cash' | 'trade') => void;
  totalItems: number;
}

const GlobalPaymentTypeSelector: React.FC<GlobalPaymentTypeSelectorProps> = ({ 
  paymentType, 
  onSelect, 
  totalItems 
}) => {
  return (
    <UnifiedPaymentTypeSelector
      paymentType={paymentType}
      onSelect={onSelect}
      size="md"
      variant="global"
      totalItems={totalItems}
      showPrompt={false}
      className="mb-4"
    />
  );
};

export default GlobalPaymentTypeSelector;
