
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';
import { Customer } from '../hooks/useCustomers';
import ReviewCustomerSection from './trade-in/ReviewCustomerSection';
import ReviewItemsSection from './trade-in/ReviewItemsSection';
import SubmitButton from './trade-in/SubmitButton';

interface TradeInReviewProps {
  items: TradeInItem[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  onRemoveItem: (index: number) => void;
  customers: Customer[];
  isLoadingCustomers: boolean;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
  totalCashValue: number;
  totalTradeValue: number;
  itemValues: Array<{
    tradeValue: number;
    cashValue: number;
    itemId: string;
  }>;
}

const TradeInReview: React.FC<TradeInReviewProps> = ({
  items,
  onBack,
  onSubmit,
  isSubmitting,
  error,
  onUpdateItem,
  onRemoveItem,
  customers,
  isLoadingCustomers,
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate,
  totalCashValue,
  totalTradeValue,
  itemValues
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Review Trade-In</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <ReviewItemsSection
        items={items}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
        totalCashValue={totalCashValue}
        totalTradeValue={totalTradeValue}
        itemValues={itemValues}
      />

      <ReviewCustomerSection
        customers={customers}
        isLoadingCustomers={isLoadingCustomers}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={onCustomerSelect}
        onCustomerCreate={onCustomerCreate}
      />

      <div className="flex justify-end">
        <SubmitButton
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isDisabled={!selectedCustomer}
          label="Submit Trade-In"
        />
      </div>
    </div>
  );
};

export default TradeInReview;
