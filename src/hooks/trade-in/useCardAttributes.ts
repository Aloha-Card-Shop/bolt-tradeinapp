
import { useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';
import { toast } from 'react-hot-toast';

interface UseCardAttributesProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useCardAttributes = ({ item, onUpdate }: UseCardAttributesProps) => {
  const toggleFirstEdition = useCallback(() => {
    console.log('Toggling First Edition for', item.card.name, 'from', item.isFirstEdition, 'to', !item.isFirstEdition);
    onUpdate({ 
      isFirstEdition: !item.isFirstEdition, 
      isLoadingPrice: true,
      // Reset calculated values to force recalculation
      cashValue: undefined,
      tradeValue: undefined,
      initialCalculation: true
    });
  }, [item.isFirstEdition, item.card.name, onUpdate]);

  const toggleHolo = useCallback(() => {
    console.log('Toggling Holo for', item.card.name, 'from', item.isHolo, 'to', !item.isHolo);
    onUpdate({ 
      isHolo: !item.isHolo, 
      isLoadingPrice: true,
      // Reset calculated values to force recalculation
      cashValue: undefined,
      tradeValue: undefined,
      initialCalculation: true
    });
  }, [item.isHolo, item.card.name, onUpdate]);

  const toggleReverseHolo = useCallback(() => {
    console.log('Toggling Reverse Holo for', item.card.name, 'from', item.isReverseHolo, 'to', !item.isReverseHolo);
    onUpdate({ 
      isReverseHolo: !item.isReverseHolo, 
      isLoadingPrice: true,
      // Reset calculated values to force recalculation
      cashValue: undefined,
      tradeValue: undefined,
      initialCalculation: true
    });
  }, [item.isReverseHolo, item.card.name, onUpdate]);

  // Placeholder functions for variants that don't exist in TradeInItem type
  const toggleUnlimited = useCallback(() => {
    console.log('toggleUnlimited called - not implemented for TradeInItem type');
  }, []);

  const toggleFirstEditionHolo = useCallback(() => {
    console.log('toggleFirstEditionHolo called - not implemented for TradeInItem type');
  }, []);

  const toggleUnlimitedHolo = useCallback(() => {
    console.log('toggleUnlimitedHolo called - not implemented for TradeInItem type');
  }, []);

  const updateCondition = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Updating condition for', item.card.name, 'to', e.target.value);
    onUpdate({ 
      condition: e.target.value as any, 
      isLoadingPrice: true,
      // Reset calculated values to force recalculation
      cashValue: undefined,
      tradeValue: undefined,
      initialCalculation: true
    });
  }, [item.card.name, onUpdate]);

  const updateQuantity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = parseInt(e.target.value);
    if (!isNaN(qty) && qty > 0) {
      console.log('Updating quantity for', item.card.name, 'to', qty);
      onUpdate({ quantity: qty });
    }
  }, [item.card.name, onUpdate]);

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
    toggleUnlimited,
    toggleFirstEditionHolo,
    toggleUnlimitedHolo,
    updateCondition,
    updateQuantity,
    updatePaymentType
  };
};
