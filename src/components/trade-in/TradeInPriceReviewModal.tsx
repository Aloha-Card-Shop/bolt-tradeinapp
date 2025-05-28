
import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInListWithCustomer';
import { Customer } from '../../hooks/useCustomers';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

interface TradeInPriceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TradeInItem[];
  selectedCustomer: Customer | null;
  onSubmit: (updatedItems: TradeInItem[], notes?: string) => void;
  onUpdateItems: (items: TradeInItem[]) => void;
  isSubmitting: boolean;
}

const TradeInPriceReviewModal: React.FC<TradeInPriceReviewModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedCustomer,
  onSubmit,
  onUpdateItems,
  isSubmitting
}) => {
  const [reviewItems, setReviewItems] = useState<TradeInItem[]>([]);
  const [notes, setNotes] = useState('');
  const [hasAdjustments, setHasAdjustments] = useState(false);

  // Initialize review items when modal opens
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setReviewItems(items.map(item => ({ ...item })));
      setHasAdjustments(false);
      setNotes('');
    }
  }, [isOpen, items]);

  // Calculate totals
  const totalCashValue = reviewItems.reduce((sum, item) => {
    if (item.paymentType === 'cash' && item.cashValue !== undefined) {
      return sum + (item.cashValue * item.quantity);
    }
    return sum;
  }, 0);

  const totalTradeValue = reviewItems.reduce((sum, item) => {
    if (item.paymentType === 'trade' && item.tradeValue !== undefined) {
      return sum + (item.tradeValue * item.quantity);
    }
    return sum;
  }, 0);

  const handlePriceAdjustment = (index: number, newPrice: number) => {
    const updatedItems = [...reviewItems];
    const oldPrice = updatedItems[index].price;
    updatedItems[index] = {
      ...updatedItems[index],
      price: newPrice,
      // Recalculate trade/cash values based on new price and payment type
      ...(updatedItems[index].paymentType === 'cash' 
        ? { cashValue: newPrice * 0.5 } // Assuming 50% cash rate
        : { tradeValue: newPrice * 0.65 }) // Assuming 65% trade rate
    };
    
    setReviewItems(updatedItems);
    setHasAdjustments(true);
    
    if (oldPrice !== newPrice) {
      toast.success(`Updated ${updatedItems[index].card.name} price to $${formatCurrency(newPrice)}`);
    }
  };

  const handleSubmitReview = () => {
    if (reviewItems.some(item => item.price <= 0)) {
      toast.error('All items must have a valid market price');
      return;
    }

    // Update the parent component's items state
    onUpdateItems(reviewItems);
    
    // Submit the trade-in
    onSubmit(reviewItems, notes.trim() || undefined);
  };

  const applyBulkAdjustment = (percentage: number) => {
    const updatedItems = reviewItems.map(item => {
      const newPrice = item.price * (1 + percentage / 100);
      return {
        ...item,
        price: newPrice,
        ...(item.paymentType === 'cash' 
          ? { cashValue: newPrice * 0.5 }
          : { tradeValue: newPrice * 0.65 })
      };
    });
    
    setReviewItems(updatedItems);
    setHasAdjustments(true);
    toast.success(`Applied ${percentage > 0 ? '+' : ''}${percentage}% adjustment to all items`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Review Trade-In Prices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adjust market prices before sending to manager for approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Customer Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Customer Information</h3>
            {selectedCustomer ? (
              <p className="text-blue-700">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
                {selectedCustomer.email && ` (${selectedCustomer.email})`}
              </p>
            ) : (
              <p className="text-red-600">No customer selected</p>
            )}
          </div>

          {/* Bulk Adjustments */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Bulk Price Adjustments</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => applyBulkAdjustment(-10)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                disabled={isSubmitting}
              >
                -10%
              </button>
              <button
                onClick={() => applyBulkAdjustment(-5)}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                disabled={isSubmitting}
              >
                -5%
              </button>
              <button
                onClick={() => applyBulkAdjustment(5)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                disabled={isSubmitting}
              >
                +5%
              </button>
              <button
                onClick={() => applyBulkAdjustment(10)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                disabled={isSubmitting}
              >
                +10%
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-900">Items ({reviewItems.length})</h3>
            {reviewItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.card.name}</h4>
                    {item.card.set && (
                      <p className="text-sm text-gray-600">{item.card.set}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>Qty: {item.quantity}</span>
                      <span>Condition: {item.condition}</span>
                      <span>Payment: {item.paymentType || 'Not selected'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    {/* Market Price Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Market Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePriceAdjustment(index, parseFloat(e.target.value) || 0)}
                          className="w-24 pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          step="0.01"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    {/* Calculated Value */}
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        {item.paymentType === 'cash' ? 'Cash Value' : 'Trade Value'}
                      </div>
                      <div className="font-medium text-green-600">
                        ${formatCurrency(
                          item.paymentType === 'cash' 
                            ? (item.cashValue || 0) * item.quantity
                            : (item.tradeValue || 0) * item.quantity
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes for Manager (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any notes about price adjustments or special considerations..."
              disabled={isSubmitting}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Trade-In Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Cash Value:</div>
                <div className="font-semibold text-green-600">${formatCurrency(totalCashValue)}</div>
              </div>
              <div>
                <div className="text-gray-600">Total Trade Value:</div>
                <div className="font-semibold text-blue-600">${formatCurrency(totalTradeValue)}</div>
              </div>
            </div>
            {hasAdjustments && (
              <div className="mt-3 flex items-center text-sm text-orange-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Prices have been manually adjusted
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || !selectedCustomer}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
              isSubmitting || !selectedCustomer
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Send to Manager
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeInPriceReviewModal;
