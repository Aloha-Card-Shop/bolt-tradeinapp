
import React from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import TradeInReview from './TradeInReview';
import TradeInItemsList from './TradeInItemsList';
import TradeInHeader from './TradeInHeader';
import TradeInEmptyState from './TradeInEmptyState';
import { useTradeInReview } from '../../hooks/useTradeInReview';

interface TradeInListProps {
  items: any[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: any) => void;
  clearList: () => void;
}

const TradeInList: React.FC<TradeInListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  clearList
}) => {
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();
  
  const {
    isReviewing,
    selectedCustomer,
    itemValuesMap,
    isSubmitting,
    error,
    validItems,
    totalCashValue,
    totalTradeValue,
    startReview,
    cancelReview,
    handleCustomerSelect,
    handleValueChange,
    handleSubmit
  } = useTradeInReview({ items, clearList });

  const handleCreateCustomer = async (first: string, last: string, email?: string, phone?: string) => {
    const newCustomer = await createCustomer(first, last, email, phone);
    handleCustomerSelect(newCustomer);
  };

  if (isReviewing) {
    return (
      <TradeInReview
        items={items}
        onBack={cancelReview}
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
          <TradeInItemsList 
            items={items}
            onRemoveItem={onRemoveItem}
            onUpdateItem={onUpdateItem}
            onValueChange={handleValueChange}
          />
          
          <div className="flex justify-end">
            <button
              onClick={startReview}
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
