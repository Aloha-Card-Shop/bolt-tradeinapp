
import { useMemo, useState } from 'react';
import { TradeInItem } from './useTradeInList';
import { Customer } from './useCustomers';
import { insertTradeInAndItems } from '../services/insertTradeInAndItems';

interface UseTradeInSubmissionProps {
  items: TradeInItem[];
  selectedCustomer: Customer | null;
  itemValuesMap: Record<string, { tradeValue: number; cashValue: number }>;
  onSuccess?: () => void;
  clearList?: () => void;
}

export const useTradeInSubmission = ({
  items,
  selectedCustomer,
  itemValuesMap,
  onSuccess,
  clearList
}: UseTradeInSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validItems = useMemo(() => items.filter(item => {
    if (!item?.card?.id || !item.card.name || !item.card.game) return false;
    if (!item.condition || item.quantity <= 0 || item.price <= 0 || item.isLoadingPrice || item.error) return false;
    return true;
  }), [items]);

  const { totalCashValue, totalTradeValue } = useMemo(() => {
    return validItems.reduce((acc, item) => {
      const cardId = item.card.id || '';
      // Make sure itemValues is a valid object with the expected properties
      const itemValues = cardId && typeof itemValuesMap[cardId] === 'object' ? itemValuesMap[cardId] : null;
      
      if (item.paymentType === 'trade') {
        // Use the trade value from itemValuesMap if available, otherwise fall back to item price
        const tradeValue = itemValues && itemValues.tradeValue !== undefined 
          ? itemValues.tradeValue
          : (item.tradeValue || item.price);
        acc.totalTradeValue += tradeValue * item.quantity;
      } else {
        // Use the cash value from itemValuesMap if available, otherwise fall back to item price
        const cashValue = itemValues && itemValues.cashValue !== undefined 
          ? itemValues.cashValue
          : (item.cashValue || item.price);
        acc.totalCashValue += cashValue * item.quantity;
      }
      
      return acc;
    }, { totalCashValue: 0, totalTradeValue: 0 });
  }, [validItems, itemValuesMap]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedCustomer) {
      setError('Please select a customer before submitting');
      return;
    }
    if (items.length === 0) {
      setError('No items in trade-in list. Add at least one.');
      return;
    }
    if (validItems.length === 0) {
      setError('No valid items to submit. Check your entries.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine payment type based on items
      let paymentType: 'cash' | 'trade' | 'mixed' = 'cash';
      const hasCashItems = validItems.some(item => item.paymentType === 'cash');
      const hasTradeItems = validItems.some(item => item.paymentType === 'trade');
      
      if (hasCashItems && hasTradeItems) {
        paymentType = 'mixed';
      } else if (hasTradeItems) {
        paymentType = 'trade';
      }

      const tradeInData = {
        customer_id: selectedCustomer.id!,
        trade_in_date: new Date().toISOString(),
        total_value: totalCashValue + totalTradeValue,
        cash_value: totalCashValue,
        trade_value: totalTradeValue,
        payment_type: paymentType,
        status: 'pending' as const
      };

      console.log('Submitting trade-in data:', tradeInData);

      const itemsData = validItems.map(item => {
        const itemValues = item.card.id && typeof itemValuesMap[item.card.id] === 'object' ? itemValuesMap[item.card.id] : null;
        
        // Get the correct cashValue and tradeValue for this item
        const cashValue = item.paymentType === 'cash' && itemValues && itemValues.cashValue !== undefined
          ? itemValues.cashValue
          : (item.cashValue || item.price);
          
        const tradeValue = item.paymentType === 'trade' && itemValues && itemValues.tradeValue !== undefined
          ? itemValues.tradeValue
          : (item.tradeValue || item.price);
          
        return {
          card: {
            id: item.card.id!,
            name: item.card.name,
            game: item.card.game,
            productId: item.card.productId
          },
          quantity: item.quantity,
          price: item.price,
          condition: item.condition as
            | 'near_mint'
            | 'lightly_played'
            | 'moderately_played'
            | 'heavily_played'
            | 'damaged',
          isFirstEdition: item.isFirstEdition,
          isHolo: item.isHolo,
          paymentType: item.paymentType,
          cashValue,
          tradeValue
        };
      });

      await insertTradeInAndItems(tradeInData, itemsData);

      // Use clearList instead of removing items one by one
      if (clearList) {
        clearList();
      }
      
      onSuccess?.();
    } catch (e) {
      console.error('Error submitting trade-in:', e);
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    validItems,
    totalCashValue,
    totalTradeValue,
    handleSubmit
  };
};
