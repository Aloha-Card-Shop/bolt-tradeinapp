
import React from 'react';
import ConditionSelect from '../shared/ConditionSelect';
import QuantityInput from '../shared/QuantityInput';
import CardAttributes from '../shared/CardAttributes';
import PaymentTypeSelector from '../shared/PaymentTypeSelector';

interface ItemControlsProps {
  condition: string;
  quantity: number;
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  paymentType: 'cash' | 'trade';
  isLoadingPrice?: boolean;
  onConditionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
}

const ItemControls: React.FC<ItemControlsProps> = ({
  condition,
  quantity,
  isFirstEdition,
  isHolo,
  isReverseHolo,
  paymentType,
  isLoadingPrice,
  onConditionChange,
  onQuantityChange,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  onPaymentTypeChange
}) => {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CardAttributes 
          isFirstEdition={isFirstEdition}
          isHolo={isHolo}
          isReverseHolo={isReverseHolo}
          onToggleFirstEdition={onToggleFirstEdition}
          onToggleHolo={onToggleHolo}
          onToggleReverseHolo={onToggleReverseHolo}
          isLoading={isLoadingPrice}
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

export default ItemControls;
