
import React from 'react';
import UnifiedPaymentTypeSelector from '../shared/PaymentTypeSelector';

interface PaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade';
  onSelect: (type: 'cash' | 'trade') => void;
  isIndividual?: boolean;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({ 
  paymentType, 
  onSelect, 
  isIndividual = false 
}) => {
  return (
    <UnifiedPaymentTypeSelector
      paymentType={paymentType}
      onSelect={onSelect}
      size="sm"
      variant="compact"
      isIndividual={isIndividual}
      showPrompt={false}
    />
  );
};

export default PaymentTypeSelector;
