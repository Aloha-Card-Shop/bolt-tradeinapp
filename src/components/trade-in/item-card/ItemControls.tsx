
import React from 'react';
import ItemConditionSelect from '../ItemConditionSelect';
import ItemQuantityInput from '../ItemQuantityInput';
import ItemTypeToggle from '../ItemTypeToggle';
import PaymentTypeSelector from '../PaymentTypeSelector';

interface ItemControlsProps {
  index: number;
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
  index,
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
    <div className="grid grid-cols-2 gap-4 mt-4">
      <ItemConditionSelect 
        id={`condition-${index}`}
        value={condition}
        onChange={onConditionChange}
      />

      <ItemQuantityInput
        id={`quantity-${index}`}
        value={quantity}
        onChange={onQuantityChange}
      />

      <ItemTypeToggle 
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
      />
    </div>
  );
};

export default ItemControls;
