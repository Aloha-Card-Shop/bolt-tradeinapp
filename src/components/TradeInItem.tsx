
import React from 'react';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';
import { useTradeValue } from '../hooks/useTradeValue';
import ItemDetails from './trade-in/ItemDetails';
import ItemConditionSelect from './trade-in/ItemConditionSelect';
import ItemQuantityInput from './trade-in/ItemQuantityInput';
import ItemTypeToggle from './trade-in/ItemTypeToggle';
import PaymentTypeSelector from './trade-in/PaymentTypeSelector';
import PriceDisplay from './trade-in/PriceDisplay';
import { ImageOff } from 'lucide-react';
import { fetchCardPrices } from '../utils/scraper';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange
}) => {
  const { cashValue, tradeValue, isLoading } = useTradeValue(item.card.game, item.price);

  // When values change, notify the parent and update the item with calculated values
  React.useEffect(() => {
    if (!isLoading && item.price > 0) {
      // Store the calculated values in the item
      onUpdate(index, { 
        ...item, 
        cashValue: cashValue,
        tradeValue: tradeValue 
      });
      
      // Notify parent component about the value change
      onValueChange({ cashValue, tradeValue });
    }
  }, [cashValue, tradeValue, isLoading, item.price, index, item, onUpdate, onValueChange]);
  
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

  const handleToggleFirstEdition = async () => {
    const newIsFirstEdition = !item.isFirstEdition;
    onUpdate(index, { ...item, isFirstEdition: newIsFirstEdition, isLoadingPrice: true, error: undefined });
    
    // Re-fetch price when edition changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          newIsFirstEdition,
          item.isHolo,
          item.card.game,
          item.isReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isFirstEdition: newIsFirstEdition, 
          price: parseFloat(data.price), 
          isLoadingPrice: false 
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isFirstEdition: newIsFirstEdition,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { ...item, isFirstEdition: newIsFirstEdition, isLoadingPrice: false });
    }
  };

  const handleToggleHolo = async () => {
    // Toggle holo and ensure reverse holo is off when holo is on
    const newIsHolo = !item.isHolo;
    onUpdate(index, { 
      ...item, 
      isHolo: newIsHolo, 
      isReverseHolo: newIsHolo ? false : item.isReverseHolo,
      isLoadingPrice: true,
      error: undefined
    });
    
    // Re-fetch price when holo status changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          item.isFirstEdition,
          newIsHolo,
          item.card.game,
          newIsHolo ? false : item.isReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isHolo: newIsHolo, 
          isReverseHolo: newIsHolo ? false : item.isReverseHolo,
          price: parseFloat(data.price),
          isLoadingPrice: false
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isHolo: newIsHolo, 
          isReverseHolo: newIsHolo ? false : item.isReverseHolo,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { 
        ...item, 
        isHolo: newIsHolo, 
        isReverseHolo: newIsHolo ? false : item.isReverseHolo,
        isLoadingPrice: false 
      });
    }
  };

  const handleToggleReverseHolo = async () => {
    // Toggle reverse holo and ensure holo is off when reverse holo is on
    const newIsReverseHolo = !item.isReverseHolo;
    onUpdate(index, { 
      ...item, 
      isReverseHolo: newIsReverseHolo, 
      isHolo: newIsReverseHolo ? false : item.isHolo,
      isLoadingPrice: true,
      error: undefined
    });
    
    // Re-fetch price when reverse holo status changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          item.isFirstEdition,
          newIsReverseHolo ? false : item.isHolo,
          item.card.game,
          newIsReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isReverseHolo: newIsReverseHolo, 
          isHolo: newIsReverseHolo ? false : item.isHolo,
          price: parseFloat(data.price),
          isLoadingPrice: false
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isReverseHolo: newIsReverseHolo, 
          isHolo: newIsReverseHolo ? false : item.isHolo,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { 
        ...item, 
        isReverseHolo: newIsReverseHolo, 
        isHolo: newIsReverseHolo ? false : item.isHolo,
        isLoadingPrice: false 
      });
    }
  };

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onUpdate(index, { ...item, price: newPrice });
  };

  // Calculate the display value based on payment type and quantity
  const displayValue = item.paymentType === 'cash' 
    ? (item.cashValue !== undefined ? item.cashValue : cashValue) * item.quantity 
    : (item.tradeValue !== undefined ? item.tradeValue : tradeValue) * item.quantity;

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-100 transition-colors duration-200">
      <div className="flex items-start space-x-4">
        {/* Card Thumbnail */}
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
          <ItemDetails 
            name={item.card.name}
            set={item.card.set}
            onRemove={() => onRemove(index)}
          />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <ItemConditionSelect 
              id={`condition-${index}`}
              value={item.condition}
              onChange={handleConditionChange}
            />

            <ItemQuantityInput
              id={`quantity-${index}`}
              value={item.quantity}
              onChange={handleQuantityChange}
            />

            <ItemTypeToggle 
              isFirstEdition={item.isFirstEdition}
              isHolo={item.isHolo}
              isReverseHolo={item.isReverseHolo}
              onToggleFirstEdition={handleToggleFirstEdition}
              onToggleHolo={handleToggleHolo}
              onToggleReverseHolo={handleToggleReverseHolo}
            />

            <PaymentTypeSelector
              paymentType={item.paymentType}
              onSelect={handlePaymentTypeChange}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {/* Editable Market Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Market Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={handlePriceChange}
                  disabled={item.isLoadingPrice}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {item.error && (
                <p className="mt-1 text-xs text-red-500">{item.error}</p>
              )}
            </div>
            
            {/* Trade/Cash Value */}
            <PriceDisplay
              label={item.paymentType === 'cash' ? 'Cash Value' : 'Trade Value'}
              isLoading={isLoading || item.isLoadingPrice || false}
              error={item.error}
              value={displayValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInItem;
