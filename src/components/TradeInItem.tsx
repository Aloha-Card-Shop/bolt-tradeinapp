
import React from 'react';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';
import { useTradeValue } from '../hooks/useTradeValue';
import ItemDetails from './trade-in/ItemDetails';
import ItemConditionSelect from './trade-in/ItemConditionSelect';
import ItemQuantityInput from './trade-in/ItemQuantityInput';
import ItemTypeToggle from './trade-in/ItemTypeToggle';
import PaymentTypeSelector from './trade-in/PaymentTypeSelector';
import PriceDisplay from './trade-in/PriceDisplay';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange
}) => {
  const { cashValue, tradeValue, isLoading } = useTradeValue(item.card.game, item.price);

  // When values change, notify the parent and update the item with calculated values
  React.useEffect(() => {
    if (!isLoading && item.price > 0) {
      // Store the calculated values in the item
      onUpdate(index, { 
        ...item, 
        cashValue: cashValue,
        tradeValue: tradeValue 
      });
      
      // Notify parent component about the value change
      onValueChange({ cashValue, tradeValue });
    }
  }, [cashValue, tradeValue, isLoading, item.price, index, item, onUpdate, onValueChange]);
  
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const condition = e.target.value;
    onConditionChange(condition);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(1, parseInt(e.target.value) || 1);
    onUpdate(index, { ...item, quantity });
  };
  
  const handlePaymentTypeChange = (type: 'cash' | 'trade') => {
    onUpdate(index, { ...item, paymentType: type });
  };

  const handleToggleFirstEdition = () => {
    onUpdate(index, { ...item, isFirstEdition: !item.isFirstEdition });
  };

  const handleToggleHolo = () => {
    // Toggle holo and ensure reverse holo is off when holo is on
    const newIsHolo = !item.isHolo;
    onUpdate(index, { 
      ...item, 
      isHolo: newIsHolo, 
      isReverseHolo: newIsHolo ? false : item.isReverseHolo 
    });
  };

  const handleToggleReverseHolo = () => {
    // Toggle reverse holo and ensure holo is off when reverse holo is on
    const newIsReverseHolo = !item.isReverseHolo;
    onUpdate(index, { 
      ...item, 
      isReverseHolo: newIsReverseHolo, 
      isHolo: newIsReverseHolo ? false : item.isHolo 
    });
  };

  // Calculate the display value based on payment type and quantity
  const displayValue = item.paymentType === 'cash' 
    ? (item.cashValue !== undefined ? item.cashValue : cashValue) * item.quantity 
    : (item.tradeValue !== undefined ? item.tradeValue : tradeValue) * item.quantity;

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-100 transition-colors duration-200">
      <ItemDetails 
        name={item.card.name}
        set={item.card.set}
        onRemove={() => onRemove(index)}
      />
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <ItemConditionSelect 
          id={`condition-${index}`}
          value={item.condition}
          onChange={handleConditionChange}
        />

        <ItemQuantityInput
          id={`quantity-${index}`}
          value={item.quantity}
          onChange={handleQuantityChange}
        />

        <ItemTypeToggle 
          isFirstEdition={item.isFirstEdition}
          isHolo={item.isHolo}
          isReverseHolo={item.isReverseHolo}
          onToggleFirstEdition={handleToggleFirstEdition}
          onToggleHolo={handleToggleHolo}
          onToggleReverseHolo={handleToggleReverseHolo}
        />

        <PaymentTypeSelector
          paymentType={item.paymentType}
          onSelect={handlePaymentTypeChange}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PriceDisplay
          label="Market Price"
          isLoading={item.isLoadingPrice || false}
          error={item.error}
          value={item.price}
        />
        
        <PriceDisplay
          label={item.paymentType === 'cash' ? 'Cash Value' : 'Trade Value'}
          isLoading={isLoading || item.isLoadingPrice || false}
          error={item.error}
          value={displayValue}
        />
      </div>
    </div>
  );
};

export default TradeInItem;
