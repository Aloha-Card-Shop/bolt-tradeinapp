
import React, { useState, useCallback } from 'react';
import { TradeInItem as TradeInItemType } from '../../hooks/useTradeInList';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../hooks/useCustomers';
import TradeInReview from './TradeInReview';
import TradeInItem from './item-card';
import { fetchCardPrices } from '../../utils/scraper';
import TradeInHeader from './TradeInHeader';
import TradeInEmptyState from './TradeInEmptyState';
import { useTradeInSubmission } from '../../hooks/useTradeInSubmission';
import { toast } from 'react-hot-toast';

interface TradeInListProps {
  items: TradeInItemType[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItemType) => void;
  clearList: () => void;
}

const TradeInList: React.FC<TradeInListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  clearList
}) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [itemValuesMap, setItemValuesMap] = useState<Record<string, { tradeValue: number; cashValue: number }>>({});
  
  const { 
    isSubmitting, 
    error, 
    validItems, 
    totalCashValue,
    totalTradeValue,
    handleSubmit
  } = useTradeInSubmission({
    items,
    selectedCustomer,
    itemValuesMap,
    clearList,
    onSuccess: () => {
      setIsReviewing(false);
      setSelectedCustomer(null);
      toast.success('Trade-in submitted successfully!');
    }
  });

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleCreateCustomer = async (first: string, last: string, email?: string, phone?: string) => {
    const newCustomer = await createCustomer(first, last, email, phone);
    setSelectedCustomer(newCustomer);
  };

  const handleConditionChange = useCallback(async (i: number, cond: string) => {
    const item = items[i];
    if (!item || !cond) {
      onUpdateItem(i, { ...item, condition: cond as any });
      return;
    }
    
    // First update to show loading state
    onUpdateItem(i, { 
      ...item, 
      condition: cond as any, 
      isLoadingPrice: true, 
      error: undefined 
    });
    
    try {
      console.log(`TradeInList: Fetching price for item ${i} with condition ${cond}`);
      const data = await fetchCardPrices(
        item.card.productId!,
        cond,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
      );
      
      // Update with new values and explicitly force recalculation
      const newItem: TradeInItemType = { 
        ...item, 
        condition: cond as any, 
        price: parseFloat(data.price), 
        isLoadingPrice: false,
        paymentType: 'cash',   // Always set payment type to cash
        cashValue: undefined,  // Reset any manual values to force recalculation
        tradeValue: undefined, // Reset any manual values to force recalculation
        initialCalculation: true // Force recalculation in useItemPrice
      };
      
      onUpdateItem(i, newItem);
      console.log(`TradeInList: Updated item ${i} with price ${data.price}, reset values and forced recalculation`, newItem);
    } catch (e) {
      onUpdateItem(i, { 
        ...item, 
        isLoadingPrice: false, 
        error: (e as Error).message,
        initialCalculation: false // Don't try to recalculate if there's an error
      });
      console.error(`TradeInList: Error fetching price for item ${i}:`, e);
    }
  }, [items, onUpdateItem]);

  const handleValueChange = useCallback((itemId: string, values: { tradeValue: number; cashValue: number }) => {
    if (!itemId) return;
    
    setItemValuesMap(prev => {
      const currentValues = prev[itemId];
      if (currentValues && 
          currentValues.tradeValue === values.tradeValue && 
          currentValues.cashValue === values.cashValue) {
        return prev;
      }
      
      return { ...prev, [itemId]: values };
    });
  }, []);

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
      <TradeInHeader 
        itemsCount={items.length} 
        totalCashValue={totalCashValue} 
        totalTradeValue={totalTradeValue} 
      />

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
        <TradeInEmptyState />
      )}
    </div>
  );
};

export default TradeInList;
