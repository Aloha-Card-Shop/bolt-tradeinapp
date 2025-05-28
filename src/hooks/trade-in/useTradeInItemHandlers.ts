
import { useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';
import { useItemPrice } from './useItemPrice';
import { useCardAttributes } from './useCardAttributes';
import { useTradeInItemState } from './handlers/useTradeInItemState';
import { useTradeInItemEffects } from './handlers/useTradeInItemEffects';

interface UseTradeInItemHandlersProps {
  item: TradeInItem;
  index: number;
  onUpdate: (index: number, item: TradeInItem) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  instanceId: string;
}

interface UseTradeInItemHandlersReturn {
  displayValue: number;
  isCalculating: boolean;
  refreshPrice: () => void;
  cashValue: number | undefined;
  tradeValue: number | undefined;
  error: string | undefined;
  handleConditionChangeWrapper: (e: React.ChangeEvent<HTMLSelectElement>) => React.ChangeEvent<HTMLSelectElement>;
  toggleFirstEdition: () => void;
  toggleHolo: () => void;
  toggleReverseHolo: () => void;
  updatePaymentType: (type: 'cash' | 'trade') => void;
  updateQuantity: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePriceChangeWrapper: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const useTradeInItemHandlers = ({
  item,
  index,
  onUpdate,
  onValueChange,
  instanceId
}: UseTradeInItemHandlersProps): UseTradeInItemHandlersReturn => {
  
  // State management
  const { initialRender, valueChangeTimeoutRef, prevPriceRef } = useTradeInItemState({ 
    item, 
    instanceId 
  });

  // Handle updates to the item
  const handleUpdate = useCallback((updates: Partial<TradeInItem>) => {
    console.log(`TradeInItem [${instanceId}]: Updating item ${item.card.name}:`, {
      currentValues: {
        price: item.price,
        cashValue: item.cashValue,
        tradeValue: item.tradeValue,
        paymentType: item.paymentType
      },
      updates
    });
    onUpdate(index, { ...item, ...updates });
  }, [index, item, onUpdate, instanceId]);

  // Handle condition changes
  const handleConditionChangeWrapper = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`TradeInItem [${instanceId}]: Condition changed for ${item.card.name} to ${e.target.value}`);
    // We're just passing the event up to the parent
    return e;
  }, [item.card.name, instanceId]);

  // Handle price and value calculations
  const { 
    displayValue, 
    isCalculating, 
    refreshPrice, 
    handlePriceChange, 
    cashValue, 
    tradeValue,
    error
  } = useItemPrice({
    item,
    onUpdate: handleUpdate
  });

  // Handle card attribute changes
  const {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity: updateQuantityFromAttributes
  } = useCardAttributes({
    item,
    onUpdate: handleUpdate
  });

  // Handle effects
  useTradeInItemEffects({
    item,
    instanceId,
    cashValue,
    tradeValue,
    isCalculating,
    onValueChange,
    refreshPrice,
    initialRender,
    valueChangeTimeoutRef,
    prevPriceRef
  });

  // Wrapper for quantity updates to match expected signature
  const updateQuantity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value);
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantityFromAttributes(quantity);
    }
  }, [updateQuantityFromAttributes]);

  // Fix: Make the handlePriceChange function accept the event format expected by ItemValues
  const handlePriceChangeWrapper = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value);
    if (!isNaN(newPrice)) {
      handlePriceChange(newPrice);
    }
  }, [handlePriceChange]);

  return {
    displayValue: displayValue || 0, // Ensure we always return a number
    isCalculating,
    refreshPrice,
    cashValue,
    tradeValue,
    error,
    handleConditionChangeWrapper,
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity,
    handlePriceChangeWrapper
  };
};
