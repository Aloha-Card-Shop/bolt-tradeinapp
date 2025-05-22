
import React, { useCallback } from 'react';
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
  // Generate unique instance ID for this wrapper
  const instanceId = `wrapper-${index}-${item.card.id || 'no-id'}`;
  
  // Log when rendering to track value changes
  console.log(`TradeInItemWrapper [${instanceId}]: Rendering for ${item.card.name}`, {
    paymentType: item.paymentType,
    cashValue: item.cashValue,
    tradeValue: item.tradeValue,
    price: item.price,
    condition: item.condition,
    game: item.card.game,
    productId: item.card.productId,
    usedFallback: item.usedFallback,
    fallbackReason: item.fallbackReason,
    initialCalculation: item.initialCalculation // Log the initialCalculation flag
  });
  
  // Handle manual value adjustment
  const handleValueAdjustment = useCallback((value: number) => {
    console.log(`TradeInItemWrapper [${instanceId}]: Manual value adjustment for ${item.card.name}:`, {
      value, 
      paymentType: item.paymentType
    });
    
    if (!item.paymentType) {
      console.warn(`TradeInItemWrapper [${instanceId}]: Payment type not selected, cannot adjust value`);
      return;
    }
    
    const updates = item.paymentType === 'cash' 
      ? { cashValue: value } 
      : { tradeValue: value };
      
    // Update the item
    onUpdate(index, { ...item, ...updates });
    
    // Notify parent about the value change
    onValueChange({
      cashValue: updates.cashValue !== undefined ? updates.cashValue : item.cashValue || 0,
      tradeValue: updates.tradeValue !== undefined ? updates.tradeValue : item.tradeValue || 0
    });
  }, [item, index, onUpdate, onValueChange, instanceId]);

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
