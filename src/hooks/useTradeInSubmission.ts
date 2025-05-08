
import { useMemo, useState } from 'react';
import { TradeInItem } from './useTradeInList';
import { Customer } from './useCustomers';
import { insertTradeInAndItems } from '../services/insertTradeInAndItems';

interface UseTradeInSubmissionProps {
  items: TradeInItem[];
  selectedCustomer: Customer | null;
  itemValuesMap: Record<string, { tradeValue: number; cashValue: number }>;
  onRemoveItem: (index: number) => void;
  onSuccess?: () => void;
}

export const useTradeInSubmission = ({
  items,
  selectedCustomer,
  itemValuesMap,
  onRemoveItem,
  onSuccess
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
      const values = itemValuesMap[cardId] || { tradeValue: 0, cashValue: 0 };
      const value = item.paymentType === 'trade' ? values.tradeValue : values.cashValue;
      
      if (item.paymentType === 'trade') {
        acc.totalTradeValue += value * item.quantity;
      } else {
        acc.totalCashValue += value * item.quantity;
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
      const tradeInData = {
        customer_id: selectedCustomer.id!,
        trade_in_date: new Date().toISOString(),
        total_value: totalCashValue + totalTradeValue,
        status: 'pending' as const
      };

      const itemsData = validItems.map(item => ({
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
        paymentType: item.paymentType
      }));

      await insertTradeInAndItems(tradeInData, itemsData);

      items.forEach((_, idx) => onRemoveItem(idx));
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
