
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
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange
}) => {
  // Add refs to track previous values and prevent unnecessary updates
  const initialMount = useRef(true);
  const prevCashValue = useRef<number | undefined>(undefined);
  const prevTradeValue = useRef<number | undefined>(undefined);
  const valueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle updates to the item
  const handleUpdate = useCallback((updates: Partial<TradeInItemType>) => {
    onUpdate(index, { ...item, ...updates });
  }, [index, item, onUpdate]);

  // Handle condition changes
  const handleConditionChangeWrapper = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onConditionChange(e.target.value);
  }, [onConditionChange]);

  // Handle price and value calculations
  const { displayValue, isCalculating, refreshPrice, handlePriceChange, cashValue, tradeValue } = useItemPrice({
    item,
    onUpdate: handleUpdate
  });

  // Debounced value change handler to prevent rapid successive updates
  const debouncedValueChange = useCallback((newCashValue: number | undefined, newTradeValue: number | undefined) => {
    // Clear any existing timeout
    if (valueChangeTimeoutRef.current) {
      clearTimeout(valueChangeTimeoutRef.current);
    }
    
    // Set a new timeout to execute after 300ms of stability
    valueChangeTimeoutRef.current = setTimeout(() => {
      if (typeof newCashValue !== 'undefined' && typeof newTradeValue !== 'undefined') {
        onValueChange({ cashValue: newCashValue, tradeValue: newTradeValue });
      }
    }, 300);
  }, [onValueChange]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (valueChangeTimeoutRef.current) {
        clearTimeout(valueChangeTimeoutRef.current);
      }
    };
  }, []);

  // Optimized effect with proper value comparison
  useEffect(() => {
    // Skip effect on initial mount to prevent initial loop
    if (initialMount.current) {
      initialMount.current = false;
      // Store initial values
      prevCashValue.current = cashValue;
      prevTradeValue.current = tradeValue;
      return;
    }

    // Only call onValueChange when values have actually changed and are defined
    if (!isCalculating && 
        cashValue !== undefined && 
        tradeValue !== undefined &&
        (cashValue !== prevCashValue.current || tradeValue !== prevTradeValue.current)) {
      
      // Update refs with new values
      prevCashValue.current = cashValue;
      prevTradeValue.current = tradeValue;
      
      // Call debounced handler instead of direct onValueChange
      debouncedValueChange(cashValue, tradeValue);
    }
    // Include all dependencies that are used in the effect
  }, [cashValue, tradeValue, isCalculating, debouncedValueChange]);

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

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-100 transition-colors duration-200">
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
        error={item.error}
        onPriceChange={handlePriceChange}
        onRefreshPrice={refreshPrice}
        isPriceUnavailable={item.isPriceUnavailable}
      />
    </div>
  );
};

export default TradeInItem;
