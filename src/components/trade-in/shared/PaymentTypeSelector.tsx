
import React from 'react';
import UnifiedPaymentTypeSelector from '../../shared/PaymentTypeSelector';

interface PaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade' | null;
  onSelect: (type: 'cash' | 'trade') => void;
  disabled?: boolean;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  paymentType,
  onSelect,
  disabled = false
}) => {
  return (
    <UnifiedPaymentTypeSelector
      paymentType={paymentType}
      onSelect={onSelect}
      size="md"
      variant="default"
      disabled={disabled}
      showPrompt={true}
    />
  );
};

export default PaymentTypeSelector;
