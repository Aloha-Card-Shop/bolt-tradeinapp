
import { useCallback, useEffect, useState } from 'react';
import { fetchCardPrices } from '../../utils/scraper';
import { toast } from 'react-hot-toast';
import { TradeInItem } from '../useTradeInList';
import { useTradeValue } from '../useTradeValue';

interface UseItemPriceProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useItemPrice = ({ item, onUpdate }: UseItemPriceProps) => {
  const { cashValue, tradeValue, isLoading } = useTradeValue(item.card.game, item.price);
  const [displayValue, setDisplayValue] = useState(0);

  // Calculate the display value based on payment type
  useEffect(() => {
    const value = item.paymentType === 'cash' 
      ? (item.cashValue !== undefined ? item.cashValue : cashValue)
      : (item.tradeValue !== undefined ? item.tradeValue : tradeValue);
    
    setDisplayValue(value * item.quantity);
    
    // Update the item with new values if they've changed
    if (!isLoading && item.price > 0) {
      const hasValueChanged = 
        item.cashValue !== cashValue || 
        item.tradeValue !== tradeValue;
      
      if (hasValueChanged) {
        onUpdate({
          cashValue: cashValue,
          tradeValue: tradeValue
        });
      }
    }
  }, [cashValue, tradeValue, isLoading, item.price, item.quantity, item.cashValue, item.tradeValue, item.paymentType, onUpdate]);

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
          isPriceUnavailable: true
        });
        toast.error("No price available for this card configuration");
      } else {
        onUpdate({ 
          price: parseFloat(data.price), 
          isLoadingPrice: false,
          isPriceUnavailable: false
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
    onUpdate({ price: newPrice });
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
