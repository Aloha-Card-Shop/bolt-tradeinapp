
import React from 'react';
import ConditionSelect from '../shared/ConditionSelect';
import QuantityInput from '../shared/QuantityInput';
import CardAttributes from '../shared/CardAttributes';
import PaymentTypeSelector from '../PaymentTypeSelector';
import { VariantAvailability } from '../../../services/variantAvailabilityService';

interface ItemControlsProps {
  condition: string;
  quantity: number;
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  paymentType: 'cash' | 'trade' | null;
  isLoadingPrice?: boolean;
  onConditionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
  availability?: VariantAvailability;
  isLoadingAvailability?: boolean;
}

const ItemControls: React.FC<ItemControlsProps> = ({
  condition,
  quantity,
  isFirstEdition,
  isHolo,
  isReverseHolo,
  paymentType,
  isLoadingPrice = false,
  onConditionChange,
  onQuantityChange,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  onPaymentTypeChange,
  availability,
  isLoadingAvailability
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <ConditionSelect 
        condition={condition}
        onChange={onConditionChange}
        disabled={isLoadingPrice}
      />
      
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
