
import { useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';
import { toast } from 'react-hot-toast';

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
      
      // Don't reset values when changing payment type - just update the type
      onUpdate({ paymentType: type });
      
      // Log to help with debugging
      if (type) {
        toast.success(`Payment type set to ${type}`);
      }
    } else {
      console.log('Payment type unchanged:', type);
    }
  }, [item.paymentType, onUpdate]);

  return {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updateCondition,
    updateQuantity,
    updatePaymentType
  };
};
