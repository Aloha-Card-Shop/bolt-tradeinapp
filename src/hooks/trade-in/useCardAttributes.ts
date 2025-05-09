
import { useCallback } from 'react';
import { fetchCardPrices } from '../../utils/scraper';
import { toast } from 'react-hot-toast';
import { TradeInItem } from '../useTradeInList';

interface UseCardAttributesProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useCardAttributes = ({ item, onUpdate }: UseCardAttributesProps) => {
  const fetchNewPrice = useCallback(async (updates: Partial<TradeInItem> = {}) => {
    // Merge the current item with updates to get the new state
    const updatedItem = { ...item, ...updates };
    const { card, condition, isFirstEdition, isHolo, isReverseHolo } = updatedItem;
    
    if (!card.productId || !condition) {
      // Just update the item without fetching a price
      onUpdate(updates);
      return;
    }
    
    // Start loading and clear any errors
    onUpdate({ 
      ...updates, 
      isLoadingPrice: true, 
      error: undefined, 
      isPriceUnavailable: false 
    });
    
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
          ...updates,
          price: 0,
          isLoadingPrice: false,
          isPriceUnavailable: true
        });
        toast.error("No price available for this card configuration");
      } else {
        onUpdate({
          ...updates,
          price: parseFloat(data.price),
          isLoadingPrice: false,
          isPriceUnavailable: false
        });
      }
    } catch (e) {
      onUpdate({
        ...updates,
        isLoadingPrice: false,
        error: (e as Error).message,
        isPriceUnavailable: false
      });
    }
  }, [item, onUpdate]);

  const toggleFirstEdition = useCallback(() => {
    const newIsFirstEdition = !item.isFirstEdition;
    fetchNewPrice({ isFirstEdition: newIsFirstEdition });
  }, [item.isFirstEdition, fetchNewPrice]);

  const toggleHolo = useCallback(() => {
    const newIsHolo = !item.isHolo;
    // When turning on holo, make sure reverse holo is off
    fetchNewPrice({ 
      isHolo: newIsHolo, 
      isReverseHolo: newIsHolo ? false : item.isReverseHolo 
    });
  }, [item.isHolo, item.isReverseHolo, fetchNewPrice]);

  const toggleReverseHolo = useCallback(() => {
    const newIsReverseHolo = !item.isReverseHolo;
    // When turning on reverse holo, make sure regular holo is off
    fetchNewPrice({ 
      isReverseHolo: newIsReverseHolo, 
      isHolo: newIsReverseHolo ? false : item.isHolo 
    });
  }, [item.isHolo, item.isReverseHolo, fetchNewPrice]);

  const updateCondition = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCondition = e.target.value;
    fetchNewPrice({ condition: newCondition as any });
  }, [fetchNewPrice]);

  const updateQuantity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(1, parseInt(e.target.value) || 1);
    onUpdate({ quantity });
  }, [onUpdate]);

  const incrementQuantity = useCallback(() => {
    onUpdate({ quantity: item.quantity + 1 });
  }, [item.quantity, onUpdate]);

  const decrementQuantity = useCallback(() => {
    if (item.quantity > 1) {
      onUpdate({ quantity: item.quantity - 1 });
    }
  }, [item.quantity, onUpdate]);

  const updatePaymentType = useCallback((type: 'cash' | 'trade') => {
    onUpdate({ paymentType: type });
  }, [onUpdate]);

  return {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updateCondition,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    updatePaymentType,
    fetchNewPrice
  };
};
