
import React, { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';
import { useCustomers } from '../hooks/useCustomers';
import { insertTradeInAndItems } from '../services/insertTradeInAndItems';
import { Customer } from '../hooks/useCustomers';
import TradeInReview from './TradeInReview';
import TradeInItem from './TradeInItem';
import { fetchCardPrices } from '../utils/scraper';

interface TradeInListProps {
  items: TradeInItemType[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItemType) => void;
}

const TradeInList: React.FC<TradeInListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem
}) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [itemValuesMap, setItemValuesMap] = useState<Record<string, { tradeValue: number; cashValue: number }>>({});

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

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setError(null);
    }
  };

  const handleCreateCustomer = async (first: string, last: string, email?: string, phone?: string) => {
    const newCustomer = await createCustomer(first, last, email, phone);
    setSelectedCustomer(newCustomer);
    setError(null);
  };

  const handleConditionChange = async (i: number, cond: string) => {
    const item = items[i];
    if (!item || !cond) {
      onUpdateItem(i, { ...item, condition: cond as any });
      return;
    }
    onUpdateItem(i, { ...item, condition: cond as any, isLoadingPrice: true, error: undefined });
    try {
      const data = await fetchCardPrices(
        item.card.productId!,
        cond,
        item.isFirstEdition,
        item.isHolo,
        item.card.game
      );
      onUpdateItem(i, { ...item, condition: cond as any, price: parseFloat(data.price), isLoadingPrice: false });
    } catch (e) {
      onUpdateItem(i, { ...item, isLoadingPrice: false, error: (e as Error).message });
    }
  };

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
      setIsReviewing(false);
      setSelectedCustomer(null);
    } catch (e) {
      console.error('Error submitting trade-in:', e);
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (itemId: string, values: { tradeValue: number; cashValue: number }) => {
    if (!itemId) return;
    setItemValuesMap(prev => ({ ...prev, [itemId]: values }));
  };

  if (isReviewing) {
    return (
      <TradeInReview
        items={items}
        onBack={() => setIsReviewing(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
        customers={customers}
        isLoadingCustomers={isLoadingCustomers}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={handleCustomerSelect}
        onCustomerCreate={handleCreateCustomer}
        totalCashValue={totalCashValue}
        totalTradeValue={totalTradeValue}
        itemValues={Object.entries(itemValuesMap).map(([itemId, values]) => ({
          itemId,
          ...values
        }))}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <ShoppingCart className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Trade-In List</h2>
          <div className="text-sm text-gray-600 mt-1 space-x-4">
            <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            <span>Cash: ${totalCashValue.toFixed(2)}</span>
            <span>Trade: ${totalTradeValue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-6">
          <div className="space-y-4">
            {items.map((item, idx) => (
              <TradeInItem
                key={item.card.id || `item-${idx}`}
                item={item}
                index={idx}
                onRemove={onRemoveItem}
                onUpdate={onUpdateItem}
                onConditionChange={(cond) => handleConditionChange(idx, cond)}
                onValueChange={(values) => handleValueChange(item.card.id || `item-${idx}`, values)}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setIsReviewing(true)}
              disabled={!validItems.length}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
            >
              Review Trade-In
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-12">
          No items in trade-in list
        </p>
      )}
    </div>
  );
};

export default TradeInList;
