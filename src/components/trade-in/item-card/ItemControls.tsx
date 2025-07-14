
import React from 'react';
import QuantityInput from '../shared/QuantityInput';
import CardAttributes from '../shared/CardAttributes';
import PaymentTypeSelector from '../PaymentTypeSelector';
import { VariantAvailability } from '../../../services/variantAvailabilityService';

interface ItemControlsProps {
  quantity: number;
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  paymentType: 'cash' | 'trade' | null;
  isLoadingPrice?: boolean;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
  availability?: VariantAvailability;
  isLoadingAvailability?: boolean;
}

const ItemControls: React.FC<ItemControlsProps> = ({
  quantity,
  isFirstEdition,
  isHolo,
  isReverseHolo,
  paymentType,
  isLoadingPrice = false,
  onQuantityChange,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  onPaymentTypeChange,
  availability,
  isLoadingAvailability
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <QuantityInput 
        quantity={quantity}
        onChange={onQuantityChange}
        disabled={isLoadingPrice}
      />
      
      <CardAttributes 
        isFirstEdition={isFirstEdition}
        isHolo={isHolo}
        isReverseHolo={isReverseHolo}
        onToggleFirstEdition={onToggleFirstEdition}
        onToggleHolo={onToggleHolo}
        onToggleReverseHolo={onToggleReverseHolo}
        isLoading={isLoadingPrice}
        availability={availability}
        isLoadingAvailability={isLoadingAvailability}
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
