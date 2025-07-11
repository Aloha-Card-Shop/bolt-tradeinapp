
import React from 'react';
import UnifiedPaymentTypeSelector from '../../shared/PaymentTypeSelector';

interface PaymentTypeSelectProps {
  paymentType: 'cash' | 'trade' | null;
  onChange: (type: 'cash' | 'trade') => void;
}

const PaymentTypeSelect: React.FC<PaymentTypeSelectProps> = ({ paymentType, onChange }) => {
  return (
    <UnifiedPaymentTypeSelector
      paymentType={paymentType}
      onSelect={onChange}
      size="sm"
      variant="compact"
      showPrompt={true}
    />
  );
};

export default PaymentTypeSelect;
