
import React from 'react';
import { X, ImageOff, DollarSign } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { CONDITIONS, PAYMENT_TYPES } from '../../constants/tradeInConstants';
import { formatCurrency } from '../../utils/formatters';
import { CardNumberObject } from '../../types/card';
import ItemTypeToggle from './ItemTypeToggle';

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
  
  // Helper function to safely get string from card number
  const getCardNumberString = (cardNumber: string | CardNumberObject | undefined): string => {
    if (!cardNumber) return '';
    
    if (typeof cardNumber === 'object') {
      return cardNumber.displayName || cardNumber.value || '';
    }
    
    return cardNumber;
  };

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onUpdateItem(index, { ...item, price: newPrice });
  };

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
                  <span className="ml-2 text-sm text-gray-500">#{getCardNumberString(item.card.number)}</span>
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
                Market Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={handlePriceChange}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <ItemTypeToggle
              isFirstEdition={item.isFirstEdition}
              isHolo={item.isHolo}
              isReverseHolo={item.isReverseHolo || false}
              onToggleFirstEdition={() => onUpdateItem(index, { ...item, isFirstEdition: !item.isFirstEdition })}
              onToggleHolo={() => {
                const newIsHolo = !item.isHolo;
                onUpdateItem(index, { 
                  ...item, 
                  isHolo: newIsHolo, 
                  isReverseHolo: newIsHolo ? false : item.isReverseHolo 
                });
              }}
              onToggleReverseHolo={() => {
                const newIsReverseHolo = !item.isReverseHolo;
                onUpdateItem(index, { 
                  ...item, 
                  isReverseHolo: newIsReverseHolo, 
                  isHolo: newIsReverseHolo ? false : item.isHolo 
                });
              }}
            />
            
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewItemCard;
