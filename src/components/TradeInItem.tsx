import React from 'react';
import { X, DollarSign, Loader2, ImageOff } from 'lucide-react';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';
import { useTradeValue } from '../hooks/useTradeValue';
import { buildTcgPlayerUrl } from '../utils/scraper';

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

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (index: number, condition: string) => void;
}

const TradeInItem: React.FC<TradeInItemProps> = ({
  item,
  index,
  onRemove,
  onUpdate,
  onConditionChange
}) => {
  const { tradeValue, cashValue, isLoading: isLoadingValue } = useTradeValue(
    item.card.game,
    item.price
  );

  const currentValue = item.paymentType === 'trade' ? tradeValue : cashValue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {item.card.imageUrl ? (
              <img 
                src={item.card.imageUrl} 
                alt={item.card.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/48x64?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">
              {item.card.name}
              {item.card.number && (
                <span className="ml-2 text-sm text-gray-500">#{item.card.number}</span>
              )}
            </h3>
            {item.card.set && (
              <p className="text-sm text-gray-600 mt-1">{item.card.set}</p>
            )}
          </div>

          <button
            onClick={() => onRemove(index)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label htmlFor={`condition-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Condition
          </label>
          <select
            id={`condition-${index}`}
            value={item.condition}
            onChange={(e) => onConditionChange(index, e.target.value)}
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
          <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            id={`quantity-${index}`}
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(index, { 
              ...item, 
              quantity: Math.max(1, parseInt(e.target.value) || 1)
            })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor={`payment-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
            Payment Type
          </label>
          <select
            id={`payment-type-${index}`}
            value={item.paymentType}
            onChange={(e) => onUpdate(index, { 
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
              {isLoadingValue ? (
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 text-gray-400" />
              )}
            </span>
            <input
              type="text"
              value={currentValue.toFixed(2)}
              readOnly
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdate(index, { ...item, isFirstEdition: !item.isFirstEdition })}
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
              onClick={() => onUpdate(index, { ...item, isHolo: !item.isHolo })}
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

      {item.card.productId && (
        <div className="mt-4 text-sm">
          <a
            href={buildTcgPlayerUrl(item.card.productId, item.condition)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View on TCGPlayer
          </a>
        </div>
      )}
    </div>
  );
};

export default TradeInItem;