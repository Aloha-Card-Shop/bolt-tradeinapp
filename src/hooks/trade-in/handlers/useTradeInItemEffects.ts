
import { useEffect, useCallback } from 'react';
import { TradeInItem } from '../../useTradeInList';

interface UseTradeInItemEffectsProps {
  item: TradeInItem;
  instanceId: string;
  cashValue: number | undefined;
  tradeValue: number | undefined;
  isCalculating: boolean;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  refreshPrice: () => void;
  initialRender: React.MutableRefObject<boolean>;
  valueChangeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  prevPriceRef: React.MutableRefObject<number>;
}

export const useTradeInItemEffects = ({
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
}: UseTradeInItemEffectsProps) => {

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
};
