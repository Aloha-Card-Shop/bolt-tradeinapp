
import React from 'react';
import QuantityInput from '../shared/QuantityInput';
import PaymentTypeSelector from '../PaymentTypeSelector';

interface ItemControlsProps {
  quantity: number;
  paymentType: 'cash' | 'trade' | null;
  isLoadingPrice?: boolean;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
}

const ItemControls: React.FC<ItemControlsProps> = ({
  quantity,
  paymentType,
  isLoadingPrice = false,
  onQuantityChange,
  onPaymentTypeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <QuantityInput 
        quantity={quantity}
        onChange={onQuantityChange}
        disabled={isLoadingPrice}
      />
      
      {paymentType && (
        <PaymentTypeSelector
          paymentType={paymentType}
          onSelect={onPaymentTypeChange}
          isIndividual={true}
        />
      )}
    </div>
  );
};

export default ItemControls;
