
import React, { useState, useCallback, useEffect } from 'react';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';
import { useCustomers } from '../hooks/useCustomers';
import { Customer } from '../hooks/useCustomers';
import TradeInReview from './TradeInReview';
import TradeInItem from './TradeInItem';
import { fetchCardPrices } from '../utils/scraper';
import TradeInHeader from './TradeInHeader';
import TradeInEmptyState from './TradeInEmptyState';
import { useTradeInSubmission } from '../hooks/useTradeInSubmission';
import { toast } from 'react-hot-toast'; // Import toast for notifications
import CharizardDetails from './trade-in/CharizardDetails';

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
  const [hasCharizard, setHasCharizard] = useState<boolean>(false);
  const [charizardSetName, setCharizardSetName] = useState<string | undefined>(undefined);
  
  // Check if there's a Charizard in the list
  useEffect(() => {
    const charizardCard = items.find(item => 
      item.card.name.toLowerCase().includes('charizard')
    );
    
    setHasCharizard(!!charizardCard);
    if (charizardCard) {
      setCharizardSetName(charizardCard.card.set);
    }
  }, [items]);
  
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
    onUpdateItem(i, { ...item, condition: cond as any, isLoadingPrice: true, error: undefined });
    try {
      const data = await fetchCardPrices(
        item.card.productId!,
        cond,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
      );
      onUpdateItem(i, { ...item, condition: cond as any, price: parseFloat(data.price), isLoadingPrice: false });
    } catch (e) {
      onUpdateItem(i, { ...item, isLoadingPrice: false, error: (e as Error).message });
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

      {hasCharizard && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Charizard Details</h3>
          <CharizardDetails setName={charizardSetName} />
        </div>
      )}

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
