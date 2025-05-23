
import { useCallback, useEffect, useRef } from 'react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { useItemPrice } from './useItemPrice';
import { useCardAttributes } from './useCardAttributes';

interface UseTradeInItemHandlersProps {
  item: TradeInItem;
  index: number;
  onUpdate: (index: number, item: TradeInItem) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  instanceId: string;
}

export const useTradeInItemHandlers = ({
  item,
  index,
  onUpdate,
  onValueChange,
  instanceId
}: UseTradeInItemHandlersProps) => {
  // Add refs to track previous values and prevent unnecessary updates
  const initialRender = useRef(true);
  const valueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPriceRef = useRef<number>(item.price);

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
    updateQuantity
  } = useCardAttributes({
    item,
    onUpdate: handleUpdate
  });

  // Check for price changes to force trade value recalculation
  useEffect(() => {
    if (prevPriceRef.current !== item.price) {
      console.log(`TradeInItem [${instanceId}]: Price changed from ${prevPriceRef.current} to ${item.price} for ${item.card.name}`);
      prevPriceRef.current = item.price;
      
      // Log what we currently have
      console.log(`TradeInItem [${instanceId}]: Current values for ${item.card.name}:`, {
        price: item.price,
        cashValue: item.cashValue,
        tradeValue: item.tradeValue,
        calculatedCashValue: cashValue,
        calculatedTradeValue: tradeValue
      });
    }
  }, [item.price, item.card.name, cashValue, tradeValue, instanceId]);

  // Notify parent of value changes with debouncing
  useEffect(() => {
    // Skip first render to avoid unnecessary updates
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    // Clear any existing timeout
    if (valueChangeTimeoutRef.current) {
      clearTimeout(valueChangeTimeoutRef.current);
    }

    // Only notify if we have valid values and aren't still calculating
    if (!isCalculating && cashValue !== undefined && tradeValue !== undefined) {
      valueChangeTimeoutRef.current = setTimeout(() => {
        console.log(`TradeInItem [${instanceId}]: Notifying parent of value change for ${item.card.name}:`, {
          cashValue,
          tradeValue
        });
        onValueChange({ cashValue, tradeValue });
      }, 100);
    }

    // Cleanup on unmount
    return () => {
      if (valueChangeTimeoutRef.current) {
        clearTimeout(valueChangeTimeoutRef.current);
      }
    };
  }, [cashValue, tradeValue, isCalculating, onValueChange, item.card.name, instanceId]);

  // Force price refresh if we have a card without a price but with a productId
  useEffect(() => {
    if (item.price <= 0 && item.card.productId && !item.isLoadingPrice && initialRender.current) {
      console.log(`TradeInItem [${instanceId}]: Card ${item.card.name} has productId but no price, triggering refresh`);
      refreshPrice();
    }
  }, [item.price, item.card.productId, item.isLoadingPrice, refreshPrice, item.card.name, instanceId]);

  // Fix: Make the handlePriceChange function accept the event format expected by ItemValues
  const handlePriceChangeWrapper = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value);
    if (!isNaN(newPrice)) {
      handlePriceChange(newPrice);
    }
  }, [handlePriceChange]);

  return {
    displayValue,
    isCalculating,
    refreshPrice,
    cashValue,
    tradeValue,
    error,
    handleUpdate,
    handleConditionChangeWrapper,
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity,
    handlePriceChangeWrapper
  };
};
