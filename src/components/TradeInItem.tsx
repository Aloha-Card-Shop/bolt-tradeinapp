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
  onValueAdjustment?: (index: number, valueType: 'cash' | 'trade', value: number) => void;
}

// This component passes props to the refactored implementation
const TradeInItemWrapper: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate, 
  onConditionChange, 
  onValueChange,
  onValueAdjustment 
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
  const handleValueAdjustment = useCallback((valueType: 'cash' | 'trade', value: number) => {
    console.log(`TradeInItemWrapper [${instanceId}]: Manual value adjustment for ${item.card.name}:`, {
      valueType,
      value, 
      paymentType: item.paymentType,
      originalCashValue: item.cashValue,
      originalTradeValue: item.tradeValue
    });
    
    // Use the new hook function if available, otherwise fall back to old method
    if (onValueAdjustment) {
      onValueAdjustment(index, valueType, value);
    } else {
      // Fallback to old method
      const updates = valueType === 'cash' 
        ? { cashValue: value } 
        : { tradeValue: value };
        
      console.log(`TradeInItemWrapper [${instanceId}]: About to update with:`, updates);
        
      // Update the item
      onUpdate(index, { ...item, ...updates });
    }
    
    // Notify parent about the value change
    const finalValues = {
      cashValue: valueType === 'cash' ? value : item.cashValue || 0,
      tradeValue: valueType === 'trade' ? value : item.tradeValue || 0
    };
    
    console.log(`TradeInItemWrapper [${instanceId}]: Notifying parent with final values:`, finalValues);
    onValueChange(finalValues);
  }, [item, index, onUpdate, onValueChange, onValueAdjustment, instanceId]);

  return (
    <TradeInItem 
      item={item}
      index={index}
      onRemove={onRemove}
      onUpdate={onUpdate}
      onConditionChange={onConditionChange}
      onValueChange={onValueChange}
      onValueAdjustment={handleValueAdjustment}
      hideDetailedPricing={false} // Show detailed pricing in wrapper context
    />
  );
};

export default TradeInItemWrapper;