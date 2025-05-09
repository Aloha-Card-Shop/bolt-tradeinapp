
import React from 'react';
import { TradeInItem } from '../../../hooks/useTradeInList';
import CardCondition from './CardCondition';
import CardQuantity from './CardQuantity';
import PaymentTypeSelect from './PaymentTypeSelect';
import PriceInput from './PriceInput';
import ValueDisplay from './ValueDisplay';
import CardAttributes from '../shared/CardAttributes';
import { useCardAttributes } from '../../../hooks/trade-in/useCardAttributes';
import { useItemPrice } from '../../../hooks/trade-in/useItemPrice';

interface ItemAttributesSectionProps {
  item: TradeInItem;
  index: number;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  itemValue?: { tradeValue: number; cashValue: number; };
}

const ItemAttributesSection: React.FC<ItemAttributesSectionProps> = ({ 
  item, 
  index, 
  onUpdateItem,
  itemValue 
}) => {
  // Handle updates to the item
  const handleUpdate = React.useCallback((updates: Partial<TradeInItem>) => {
    onUpdateItem(index, { ...item, ...updates });
  }, [index, item, onUpdateItem]);

  // Use our shared card attributes hook
  const {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updateCondition,
    updateQuantity,
    updatePaymentType
  } = useCardAttributes({
    item,
    onUpdate: handleUpdate
  });

  // Use our shared price hook
  const { 
    displayValue, 
    handlePriceChange 
  } = useItemPrice({
    item,
    onUpdate: handleUpdate
  });

  // Handle custom price change format from review screen
  const handleCustomPriceChange = (price: number) => {
    handleUpdate({ price, isPriceUnavailable: false });
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <CardCondition 
        condition={item.condition}
        onChange={updateCondition}
      />

      <CardQuantity 
        quantity={item.quantity} 
        onChange={updateQuantity}
      />

      <CardAttributes
        isFirstEdition={item.isFirstEdition}
        isHolo={item.isHolo}
        isReverseHolo={item.isReverseHolo || false}
        onToggleFirstEdition={toggleFirstEdition}
        onToggleHolo={toggleHolo}
        onToggleReverseHolo={toggleReverseHolo}
        isLoading={item.isLoadingPrice}
      />

      <PaymentTypeSelect
        paymentType={item.paymentType}
        onChange={updatePaymentType}
      />

      <PriceInput
        price={item.price}
        onChange={handleCustomPriceChange}
        error={item.error}
        isPriceUnavailable={item.isPriceUnavailable}
      />

      <ValueDisplay
        value={displayValue}
        quantity={item.quantity}
      />
    </div>
  );
};

export default ItemAttributesSection;
