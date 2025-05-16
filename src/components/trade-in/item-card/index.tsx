
import React, { useCallback, useEffect, useRef } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import { useItemPrice } from '../../../hooks/trade-in/useItemPrice';
import { useCardAttributes } from '../../../hooks/trade-in/useCardAttributes';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  onValueAdjustment?: (value: number) => void;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange,
  onValueAdjustment
}) => {
  // Add refs to track previous values and prevent unnecessary updates
  const initialRender = useRef(true);
  const valueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle updates to the item
  const handleUpdate = useCallback((updates: Partial<TradeInItemType>) => {
    console.log(`TradeInItem: Updating item ${item.card.name}:`, updates);
    onUpdate(index, { ...item, ...updates });
  }, [index, item, onUpdate]);

  // Handle condition changes
  const handleConditionChangeWrapper = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`TradeInItem: Condition changed for ${item.card.name} to ${e.target.value}`);
    onConditionChange(e.target.value);
  }, [onConditionChange, item.card.name]);

  // Handle price and value calculations
  const { 
    displayValue, 
    isCalculating, 
    refreshPrice, 
    handlePriceChange, 
    cashValue, 
    tradeValue,
    error
  } = useItemPrice({
    item,
    onUpdate: handleUpdate
  });

  // Notify parent of value changes with debouncing
  useEffect(() => {
    // Skip first render to avoid unnecessary updates
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    // Clear any existing timeout
    if (valueChangeTimeoutRef.current) {
      clearTimeout(valueChangeTimeoutRef.current);
    }

    // Only notify if we have valid values and aren't still calculating
    if (!isCalculating && cashValue !== undefined && tradeValue !== undefined) {
      valueChangeTimeoutRef.current = setTimeout(() => {
        console.log(`Notifying parent of value change for ${item.card.name}:`, {
          cashValue,
          tradeValue
        });
        onValueChange({ cashValue, tradeValue });
      }, 100);
    }

    // Cleanup on unmount
    return () => {
      if (valueChangeTimeoutRef.current) {
        clearTimeout(valueChangeTimeoutRef.current);
      }
    };
  }, [cashValue, tradeValue, isCalculating, onValueChange, item.card.name]);

  // Handle card attribute changes
  const {
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity
  } = useCardAttributes({
    item,
    onUpdate: handleUpdate
  });

  // Handle manual value adjustments if needed
  const handleValueAdjustment = useCallback((value: number) => {
    console.log(`Manual value adjustment for ${item.card.name}: ${value}`);
    if (onValueAdjustment) {
      onValueAdjustment(value);
    }
  }, [item.card.name, onValueAdjustment]);

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-100 transition-colors duration-200 bg-white shadow-sm">
      <CardHeader 
        card={item.card} 
        index={index}
        onRemove={onRemove}
      />
      
      <ItemControls
        condition={item.condition}
        quantity={item.quantity}
        isFirstEdition={item.isFirstEdition}
        isHolo={item.isHolo}
        isReverseHolo={item.isReverseHolo || false}
        paymentType={item.paymentType}
        isLoadingPrice={item.isLoadingPrice}
        onConditionChange={handleConditionChangeWrapper}
        onQuantityChange={updateQuantity}
        onToggleFirstEdition={toggleFirstEdition}
        onToggleHolo={toggleHolo}
        onToggleReverseHolo={toggleReverseHolo}
        onPaymentTypeChange={updatePaymentType}
      />

      <ItemValues
        price={item.price}
        paymentType={item.paymentType}
        displayValue={displayValue}
        isLoading={isCalculating}
        isLoadingPrice={item.isLoadingPrice}
        error={error || item.error}
        onPriceChange={handlePriceChange}
        onRefreshPrice={refreshPrice}
        isPriceUnavailable={item.isPriceUnavailable}
        onValueAdjustment={handleValueAdjustment}
      />
      
      {/* Debug information about game type */}
      {item.card && !item.card.game && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          Missing game type for {item.card.name}. This is required for value calculation.
        </div>
      )}
      
      {item.price <= 0 && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
          Card price must be greater than 0 to calculate values.
        </div>
      )}
    </div>
  );
};

export default TradeInItem;
