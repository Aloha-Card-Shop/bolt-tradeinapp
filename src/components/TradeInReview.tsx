import React, { useMemo } from 'react';
import { ArrowLeft, Receipt, User, Loader2, ImageOff, DollarSign, X } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';
import { Customer } from '../hooks/useCustomers';
import CustomerSelect from './CustomerSelect';

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
  onCustomerSelect: (customer: Customer) => void;
  onCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<void>;
  totalCashValue: number;
  totalTradeValue: number;
  itemValues: Array<{
    tradeValue: number;
    cashValue: number;
    itemId: string;
  }>;
}

const CONDITIONS = [
  { value: '', label: 'Select condition' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'lightly_played', label: 'Lightly Played' },
  { value: 'moderately_played', label: 'Moderately Played' },
  { value: 'heavily_played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Damaged' }
];

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'trade', label: 'Trade' }
];

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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Customer Information</h3>
        </div>

        <CustomerSelect
          customers={customers}
          isLoading={isLoadingCustomers}
          selectedCustomer={selectedCustomer}
          onSelect={onCustomerSelect}
          onCreateNew={onCustomerCreate}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Trade-In Items</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Values:</p>
            <p className="font-medium text-gray-900">Cash: ${totalCashValue.toFixed(2)}</p>
            <p className="font-medium text-gray-900">Trade: ${totalTradeValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const itemValue = itemValues.find(v => v.itemId === item.card.id);
            const currentValue = item.paymentType === 'trade' ? itemValue?.tradeValue : itemValue?.cashValue;

            return (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.card.imageUrl ? (
                      <img 
                        src={item.card.imageUrl} 
                        alt={item.card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/64x80?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.card.name}
                          {item.card.number && (
                            <span className="ml-2 text-sm text-gray-500">#{item.card.number}</span>
                          )}
                        </h4>
                        {item.card.set && (
                          <p className="text-sm text-gray-600">{item.card.set}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) => onUpdateItem(index, { 
                            ...item, 
                            condition: e.target.value as any 
                          })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {CONDITIONS.map(condition => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onUpdateItem(index, { 
                            ...item, 
                            quantity: Math.max(1, parseInt(e.target.value) || 1)
                          })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Type
                        </label>
                        <select
                          value={item.paymentType}
                          onChange={(e) => onUpdateItem(index, { 
                            ...item, 
                            paymentType: e.target.value as 'cash' | 'trade' 
                          })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {PAYMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </span>
                          <input
                            type="text"
                            value={currentValue?.toFixed(2) ?? '0.00'}
                            readOnly
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateItem(index, { ...item, isFirstEdition: !item.isFirstEdition })}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              item.isFirstEdition
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {item.isFirstEdition ? '1st Edition' : 'Unlimited'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateItem(index, { ...item, isHolo: !item.isHolo })}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              item.isHolo
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {item.isHolo ? 'Holo' : 'Non-Holo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !selectedCustomer}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Trade-In'
          )}
        </button>
      </div>
    </div>
  );
};

export default TradeInReview;