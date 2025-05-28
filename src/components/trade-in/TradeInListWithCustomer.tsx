
import React, { useState } from 'react';
import { ShoppingBagIcon, XCircleIcon } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInListWithCustomer';
import { Customer } from '../../hooks/useCustomers';
import TradeInItemsList from './TradeInItemsList';
import CustomerSection from './CustomerSection';
import GlobalPaymentTypeSelector from './GlobalPaymentTypeSelector';
import TradeInPriceReviewModal from './TradeInPriceReviewModal';
import { insertTradeInAndItems } from '../../services/insertTradeInAndItems';
import { toast } from 'react-hot-toast';

interface TradeInListWithCustomerProps {
  items: TradeInItem[];
  selectedCustomer: Customer | null;
  customers: Customer[];
  isLoadingCustomers: boolean;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
  clearList: () => void;
}

const TradeInListWithCustomer: React.FC<TradeInListWithCustomerProps> = ({
  items,
  selectedCustomer,
  customers,
  isLoadingCustomers,
  onRemoveItem,
  onUpdateItem,
  onCustomerSelect,
  onCustomerCreate,
  clearList,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate totals for the trade-in list
  const tradeTotalValue = items.reduce((sum, item) => {
    if (item.paymentType === 'trade' && item.tradeValue !== undefined) {
      return sum + (item.tradeValue * item.quantity);
    }
    return sum;
  }, 0);
  
  const cashTotalValue = items.reduce((sum, item) => {
    if (item.paymentType === 'cash' && item.cashValue !== undefined) {
      return sum + (item.cashValue * item.quantity);
    }
    return sum;
  }, 0);

  // Determine the most common payment type to show as default
  const cashCount = items.filter(item => item.paymentType === 'cash').length;
  const tradeCount = items.filter(item => item.paymentType === 'trade').length;
  const globalPaymentType = cashCount >= tradeCount ? 'cash' : 'trade';

  // Handle global payment type change
  const handleGlobalPaymentTypeChange = (type: 'cash' | 'trade') => {
    items.forEach((item, index) => {
      if (item.paymentType !== type) {
        onUpdateItem(index, { ...item, paymentType: type });
      }
    });
  };

  const handleClearAll = () => {
    clearList();
  };

  const handleOpenReview = () => {
    // Validate that all items have payment types selected
    const itemsWithoutPaymentType = items.filter(item => !item.paymentType);
    if (itemsWithoutPaymentType.length > 0) {
      toast.error('Please select payment type for all items before proceeding');
      return;
    }

    // Validate that all items have valid prices
    const itemsWithoutPrice = items.filter(item => !item.price || item.price <= 0);
    if (itemsWithoutPrice.length > 0) {
      toast.error('All items must have a valid market price');
      return;
    }

    setShowReviewModal(true);
  };

  const handleSubmitTradeIn = async (reviewedItems: TradeInItem[], notes?: string) => {
    if (!selectedCustomer || !selectedCustomer.id) {
      toast.error('Please select a customer');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tradeInData = {
        customer_id: selectedCustomer.id,
        trade_in_date: new Date().toISOString(),
        total_value: cashTotalValue + tradeTotalValue,
        cash_value: cashTotalValue,
        trade_value: tradeTotalValue,
        notes: notes || null,
        status: 'pending' as const,
        payment_type: cashTotalValue > 0 && tradeTotalValue > 0 ? 'mixed' as const : 
                     tradeTotalValue > 0 ? 'trade' as const : 'cash' as const
      };

      await insertTradeInAndItems(tradeInData, reviewedItems);
      
      toast.success('Trade-in submitted successfully!');
      clearList();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting trade-in:', error);
      toast.error('Failed to submit trade-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItems = (updatedItems: TradeInItem[]) => {
    // Update all items in the parent component
    updatedItems.forEach((item, index) => {
      onUpdateItem(index, item);
    });
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2 bg-green-100 rounded-lg">
          <ShoppingBagIcon className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Trade-In List</h2>
      </div>

      {/* Customer Section */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200">
        <CustomerSection
          selectedCustomer={selectedCustomer}
          customers={customers}
          isLoadingCustomers={isLoadingCustomers}
          onCustomerSelect={onCustomerSelect}
          onCustomerCreate={onCustomerCreate}
        />
      </div>

      {items.length > 0 ? (
        <>
          {/* Global Payment Type Selector */}
          <GlobalPaymentTypeSelector
            paymentType={globalPaymentType}
            onSelect={handleGlobalPaymentTypeChange}
            totalItems={totalItemCount}
          />

          {/* Items List */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
              <div className="font-medium text-gray-700">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Clear all
              </button>
            </div>
            
            <TradeInItemsList 
              items={items}
              onRemoveItem={onRemoveItem}
              onUpdateItem={onUpdateItem}
              onValueChange={() => {}} // Add this empty function to satisfy the prop type
              hideDetailedPricing={true}
            />
            
            <div className="p-5 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Cash Value:</span>
                <span className="font-semibold">${cashTotalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Trade Value:</span>
                <span className="font-semibold">${tradeTotalValue.toFixed(2)}</span>
              </div>
              
              {items.length > 0 && (
                <div className="mt-4">
                  <button 
                    onClick={handleOpenReview}
                    className={`w-full py-3 px-4 font-medium rounded-lg transition-colors ${
                      selectedCustomer 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!selectedCustomer}
                    title={!selectedCustomer ? 'Please select a customer first' : ''}
                  >
                    Review & Send to Manager
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No cards added</h3>
          <p className="text-gray-500">
            Search for cards and add them to your trade-in list
          </p>
        </div>
      )}

      {/* Price Review Modal */}
      <TradeInPriceReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        items={items}
        selectedCustomer={selectedCustomer}
        onSubmit={handleSubmitTradeIn}
        onUpdateItems={handleUpdateItems}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TradeInListWithCustomer;
