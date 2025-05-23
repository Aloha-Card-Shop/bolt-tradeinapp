
import React from 'react';
import QuantityInput from '../shared/QuantityInput';
import PaymentTypeSelector from '../shared/PaymentTypeSelector';

interface CertifiedCardControlsProps {
  quantity: number;
  paymentType: 'cash' | 'trade' | null;
  isLoadingPrice?: boolean;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
  grade?: string;
}

const CertifiedCardControls: React.FC<CertifiedCardControlsProps> = ({
  quantity,
  paymentType,
  isLoadingPrice,
  onQuantityChange,
  onPaymentTypeChange,
  grade
}) => {
  return (
    <div className="mt-4">
      <div className="mb-3">
        <div className="bg-blue-50 text-blue-700 rounded-md p-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium">PSA Grade</span>
            <div className="font-bold text-lg">{grade || 'N/A'}</div>
          </div>
          <div className="bg-white px-3 py-1 rounded-full text-blue-600 font-bold border border-blue-200">
            Certified
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <QuantityInput
          quantity={quantity}
          onChange={onQuantityChange}
          disabled={isLoadingPrice}
        />

        <PaymentTypeSelector
          paymentType={paymentType}
          onSelect={onPaymentTypeChange}
          disabled={isLoadingPrice}
        />
      </div>
    </div>
  );
};

export default CertifiedCardControls;
