
import React from 'react';
import { X, ImageOff, DollarSign } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { CONDITIONS, PAYMENT_TYPES } from '../../constants/tradeInConstants';
import { formatCurrency } from '../../utils/formatters';

interface ReviewItemCardProps {
  item: TradeInItem;
  index: number;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  onRemoveItem: (index: number) => void;
  itemValue?: { tradeValue: number; cashValue: number; };
}

const ReviewItemCard: React.FC<ReviewItemCardProps> = ({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  itemValue
}) => {
  const currentValue = item.paymentType === 'trade' ? itemValue?.tradeValue : itemValue?.cashValue;
  
  return (
    <div className="border border-gray-200 rounded-xl p-4">
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
                  value={formatCurrency((currentValue || 0) * item.quantity)}
                  readOnly
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateItem(index, { ...item, isFirstEdition: !item.isFirstEdition })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                    item.isFirstEdition
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.isFirstEdition ? '1st Edition' : 'Unlimited'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateItem(index, { 
                    ...item, 
                    isHolo: !item.isHolo,
                    isReverseHolo: item.isHolo ? item.isReverseHolo : false
                  })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                    item.isHolo && !item.isReverseHolo
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={item.isReverseHolo}
                >
                  {item.isHolo && !item.isReverseHolo ? 'Holo' : 'Non-Holo'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateItem(index, { 
                    ...item, 
                    isReverseHolo: !item.isReverseHolo,
                    isHolo: item.isReverseHolo ? item.isHolo : false 
                  })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                    item.isReverseHolo
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={item.isHolo && !item.isReverseHolo}
                >
                  {item.isReverseHolo ? 'Reverse Holo' : 'Standard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewItemCard;
