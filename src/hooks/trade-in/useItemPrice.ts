
import { useCallback, useEffect, useState, useRef } from 'react';
import { fetchCardPrices } from '../../utils/scraper';
import { toast } from 'react-hot-toast';
import { TradeInItem } from '../useTradeInList';
import { useTradeValue } from '../useTradeValue';

interface UseItemPriceProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useItemPrice = ({ item, onUpdate }: UseItemPriceProps) => {
  // Get standard calculated values from the trade value hook
  const { cashValue: calculatedCashValue, tradeValue: calculatedTradeValue, isLoading } = useTradeValue(item.card.game, item.price);
  
  // Use the manually set values if they exist, otherwise use the calculated values
  const cashValue = item.cashValue !== undefined ? item.cashValue : calculatedCashValue;
  const tradeValue = item.tradeValue !== undefined ? item.tradeValue : calculatedTradeValue;
  
  const [displayValue, setDisplayValue] = useState(0);
  
  // Add refs to track previous calculated values for comparison
  const prevCashValue = useRef<number | undefined>(undefined);
  const prevTradeValue = useRef<number | undefined>(undefined);

  // Calculate the display value based on payment type
  useEffect(() => {
    const value = item.paymentType === 'cash' ? cashValue : tradeValue;
    setDisplayValue(value * item.quantity);
    
    // Only update the calculated values if they've changed and no manual override exists
    if (!isLoading && item.price > 0) {
      const hasCashValueChanged = item.cashValue === undefined && 
                                calculatedCashValue !== prevCashValue.current;
      
      const hasTradeValueChanged = item.tradeValue === undefined &&
                                 calculatedTradeValue !== prevTradeValue.current;
      
      // Update only if either calculated value has meaningfully changed and there's no manual override
      if (hasCashValueChanged || hasTradeValueChanged) {
        // Store new calculated values in refs
        prevCashValue.current = calculatedCashValue;
        prevTradeValue.current = calculatedTradeValue;
        
        // Update with new calculated values, preserving any manual overrides
        const updates: Partial<TradeInItem> = {};
        
        if (item.cashValue === undefined) {
          updates.cashValue = calculatedCashValue;
        }
        
        if (item.tradeValue === undefined) {
          updates.tradeValue = calculatedTradeValue;
        }
        
        // Only update if we have changes to make
        if (Object.keys(updates).length > 0) {
          onUpdate(updates);
        }
      }
    }
  }, [
    calculatedCashValue, 
    calculatedTradeValue, 
    isLoading, 
    item.price, 
    item.quantity, 
    item.cashValue, 
    item.tradeValue, 
    item.paymentType, 
    onUpdate,
    cashValue,
    tradeValue
  ]);

  const refreshPrice = useCallback(async () => {
    const { card, condition, isFirstEdition, isHolo, isReverseHolo } = item;
    
    if (!card.productId || !condition) {
      return; // Can't refresh without product ID and condition
    }
    
    onUpdate({ isLoadingPrice: true, error: undefined, isPriceUnavailable: false });
    
    try {
      const data = await fetchCardPrices(
        card.productId,
        condition,
        isFirstEdition,
        isHolo,
        card.game,
        isReverseHolo
      );
      
      if (data.unavailable) {
        onUpdate({ 
          price: 0, 
          isLoadingPrice: false,
          isPriceUnavailable: true,
          cashValue: undefined, // Reset any manual values when price changes
          tradeValue: undefined
        });
        toast.error("No price available for this card configuration");
      } else {
        onUpdate({ 
          price: parseFloat(data.price), 
          isLoadingPrice: false,
          isPriceUnavailable: false,
          cashValue: undefined, // Reset any manual values when price changes
          tradeValue: undefined
        });
      }
    } catch (e) {
      onUpdate({ 
        isLoadingPrice: false, 
        error: (e as Error).message,
        isPriceUnavailable: false
      });
    }
  }, [item, onUpdate]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onUpdate({ 
      price: newPrice,
      // Reset manual values when market price changes
      cashValue: undefined,
      tradeValue: undefined 
    });
  }, [onUpdate]);

  return {
    displayValue,
    isCalculating: isLoading,
    refreshPrice,
    handlePriceChange,
    cashValue,
    tradeValue
  };
};
