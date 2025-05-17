
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
  onUpdateItem
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

  // Use our shared price hook - we'll just use what we need from it
  const { 
    cashValue,
    tradeValue,
    error
  } = useItemPrice({
    item,
    onUpdate: handleUpdate
  });
  
  console.log('ItemAttributesSection rendering for', item.card.name, {
    cashValue,
    tradeValue,
    paymentType: item.paymentType,
    price: item.price,
    itemCashValue: item.cashValue,
    itemTradeValue: item.tradeValue
  });

  // Handle custom price change format from review screen
  const handleCustomPriceChange = (price: number) => {
    handleUpdate({ price, isPriceUnavailable: false });
  };

  // Handle manual value adjustment
  const handleValueChange = (value: number) => {
    if (item.paymentType === 'cash') {
      handleUpdate({ cashValue: value });
    } else if (item.paymentType === 'trade') {
      handleUpdate({ tradeValue: value });
    }
  };

  // Create adapter functions to match the expected types
  const handleConditionChange = (condition: string) => {
    updateCondition({ target: { value: condition } } as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleQuantityChange = (quantity: number) => {
    updateQuantity({ target: { value: quantity.toString() } } as React.ChangeEvent<HTMLInputElement>);
  };

  // Handle payment type change for nullable types
  const handlePaymentTypeChange = (type: 'cash' | 'trade') => {
    console.log('Changing payment type to', type, 'for item', item.card.name);
    updatePaymentType(type);
  };

  // Calculate the value to display based on payment type
  const displayValue = React.useMemo(() => {
    if (!item.paymentType) return 0;
    
    const baseValue = item.paymentType === 'cash' 
      ? (item.cashValue !== undefined ? item.cashValue : cashValue)
      : (item.tradeValue !== undefined ? item.tradeValue : tradeValue);
      
    console.log('Calculated display value:', baseValue * item.quantity, 'based on', {
      paymentType: item.paymentType,
      baseValue,
      quantity: item.quantity,
      cashValue,
      tradeValue,
      itemCashValue: item.cashValue,
      itemTradeValue: item.tradeValue
    });
      
    return baseValue * item.quantity;
  }, [item.paymentType, item.cashValue, item.tradeValue, item.quantity, cashValue, tradeValue]);

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <CardCondition 
        condition={item.condition}
        onChange={handleConditionChange}
      />

      <CardQuantity 
        quantity={item.quantity} 
        onChange={handleQuantityChange}
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
        onChange={handlePaymentTypeChange}
      />

      <PriceInput
        price={item.price}
        onChange={handleCustomPriceChange}
        error={item.error}
        isPriceUnavailable={item.isPriceUnavailable}
      />

      <ValueDisplay
        value={displayValue}
        quantity={1} // We're already multiplying by quantity in displayValue
        onValueChange={handleValueChange}
      />
      
      {error && (
        <div className="col-span-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ItemAttributesSection;
