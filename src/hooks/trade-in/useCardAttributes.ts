
import { useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';

interface UseCardAttributesProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useCardAttributes = ({ item, onUpdate }: UseCardAttributesProps) => {
  const toggleFirstEdition = useCallback(() => {
    onUpdate({ isFirstEdition: !item.isFirstEdition, isLoadingPrice: true });
  }, [item.isFirstEdition, onUpdate]);

  const toggleHolo = useCallback(() => {
    onUpdate({ isHolo: !item.isHolo, isLoadingPrice: true });
  }, [item.isHolo, onUpdate]);

  const toggleReverseHolo = useCallback(() => {
    onUpdate({ isReverseHolo: !item.isReverseHolo, isLoadingPrice: true });
  }, [item.isReverseHolo, onUpdate]);

  const updateCondition = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ condition: e.target.value as any, isLoadingPrice: true });
  }, [onUpdate]);

  const updateQuantity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = parseInt(e.target.value);
    if (!isNaN(qty) && qty > 0) {
      onUpdate({ quantity: qty });
    }
  }, [onUpdate]);

  const updatePaymentType = useCallback((type: 'cash' | 'trade' | null) => {
    console.log('useCardAttributes: updatePaymentType called with type:', type);
    
    // Only update if payment type is actually changing
    if (item.paymentType !== type) {
      console.log('Updating payment type from', item.paymentType, 'to', type);
      
      // Reset cashValue and tradeValue when changing payment type
      onUpdate({ 
        paymentType: type,
        // Only reset the values if they were manually set before
        ...(item.cashValue !== undefined && type === 'trade' ? { cashValue: undefined } : {}),
        ...(item.tradeValue !== undefined && type === 'cash' ? { tradeValue: undefined } : {})
      });
    } else {
      console.log('Payment type unchanged:', type);
    }
  }, [item.paymentType, item.cashValue, item.tradeValue, onUpdate]);

  return {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updateCondition,
    updateQuantity,
    updatePaymentType
  };
};
