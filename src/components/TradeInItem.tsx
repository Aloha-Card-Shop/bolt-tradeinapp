
import React from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';
import { useTradeValue } from '../hooks/useTradeValue';

interface TradeInItemProps {
  item: TradeInItem;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItem) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

const CONDITIONS = [
  { value: '', label: 'Select condition' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'lightly_played', label: 'Lightly Played' },
  { value: 'moderately_played', label: 'Moderately Played' },
  { value: 'heavily_played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Damaged' }
];

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange
}) => {
  const { cashValue, tradeValue, isLoading } = useTradeValue(item.card.game, item.price);

  // When values change, notify the parent
  React.useEffect(() => {
    onValueChange({ cashValue, tradeValue });
  }, [cashValue, tradeValue, onValueChange]);
  
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const condition = e.target.value;
    onConditionChange(condition);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(1, parseInt(e.target.value) || 1);
    onUpdate(index, { ...item, quantity });
  };
  
  const handlePaymentTypeChange = (type: 'cash' | 'trade') => {
    onUpdate(index, { ...item, paymentType: type });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-100 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-gray-900">{item.card.name}</h3>
        <button
          onClick={() => onRemove(index)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          title="Remove from list"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {item.card.set && (
        <p className="text-sm text-gray-600 mt-0.5">{item.card.set}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label htmlFor={`condition-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
            Condition
          </label>
          <select
            id={`condition-${index}`}
            value={item.condition}
            onChange={handleConditionChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {CONDITIONS.map(condition => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`quantity-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            id={`quantity-${index}`}
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => onUpdate(index, { ...item, isFirstEdition: !item.isFirstEdition })}
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
              onClick={() => onUpdate(index, { ...item, isHolo: !item.isHolo })}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                item.isHolo
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.isHolo ? 'Holo' : 'Non-Holo'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Payment Type
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('cash')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                item.paymentType === 'cash'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => handlePaymentTypeChange('trade')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                item.paymentType === 'trade'
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trade
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Market Price
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </span>
            <div className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm">
              {item.isLoadingPrice ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                  <span>Loading...</span>
                </div>
              ) : item.error ? (
                <span className="text-red-500 text-xs">{item.error}</span>
              ) : (
                item.price.toFixed(2)
              )}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {item.paymentType === 'cash' ? 'Cash Value' : 'Trade Value'}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </span>
            <div className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm">
              {isLoading || item.isLoadingPrice ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                  <span>Calculating...</span>
                </div>
              ) : item.error ? (
                <span className="text-red-500 text-xs">Error</span>
              ) : (
                ((item.paymentType === 'cash' ? cashValue : tradeValue) * item.quantity).toFixed(2)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInItem;
