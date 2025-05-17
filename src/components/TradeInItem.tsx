
import React from 'react';
import TradeInItem from './trade-in/item-card';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

// This component passes props to the refactored implementation
const TradeInItemWrapper: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate, 
  onConditionChange, 
  onValueChange 
}) => {
  // Log when rendering to track value changes
  console.log('TradeInItemWrapper rendering for', item.card.name, {
    paymentType: item.paymentType,
    cashValue: item.cashValue,
    tradeValue: item.tradeValue,
    price: item.price,
    condition: item.condition
  });
  
  // Handle manual value adjustment
  const handleValueAdjustment = (value: number) => {
    console.log('Manual value adjustment for', item.card.name, ':', value, 'with payment type:', item.paymentType);
    
    const updates = item.paymentType === 'cash' 
      ? { cashValue: value } 
      : { tradeValue: value };
      
    // Update the item
    onUpdate(index, { ...item, ...updates });
    
    // Notify parent about the value change
    onValueChange({
      cashValue: updates.cashValue || item.cashValue || 0,
      tradeValue: updates.tradeValue || item.tradeValue || 0
    });
  };

  return (
    <TradeInItem 
      item={item}
      index={index}
      onRemove={onRemove}
      onUpdate={onUpdate}
      onConditionChange={onConditionChange}
      onValueChange={onValueChange}
      onValueAdjustment={handleValueAdjustment}
    />
  );
};

export default TradeInItemWrapper;
