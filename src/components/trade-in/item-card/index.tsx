
import React, { useCallback, useEffect, useRef } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import { useItemPrice } from '../../../hooks/trade-in/useItemPrice';
import { useCardAttributes } from '../../../hooks/trade-in/useCardAttributes';
import { GameType } from '../../../types/card';

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
  // Component instance ID for debugging
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  
  // Log component rendering with key details
  console.log(`TradeInItem [${instanceId}]: Rendering for ${item.card.name}`, {
    index,
    price: item.price,
    cashValue: item.cashValue,
    tradeValue: item.tradeValue,
    paymentType: item.paymentType,
    game: item.card.game,
    productId: item.card.productId
  });
  
  // Add refs to track previous values and prevent unnecessary updates
  const initialRender = useRef(true);
  const valueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPriceRef = useRef<number>(item.price);

  // Handle updates to the item
  const handleUpdate = useCallback((updates: Partial<TradeInItemType>) => {
    console.log(`TradeInItem [${instanceId}]: Updating item ${item.card.name}:`, {
      currentValues: {
        price: item.price,
        cashValue: item.cashValue,
        tradeValue: item.tradeValue,
        paymentType: item.paymentType
      },
      updates
    });
    onUpdate(index, { ...item, ...updates });
  }, [index, item, onUpdate, instanceId]);

  // Handle condition changes
  const handleConditionChangeWrapper = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`TradeInItem [${instanceId}]: Condition changed for ${item.card.name} to ${e.target.value}`);
    onConditionChange(e.target.value);
  }, [onConditionChange, item.card.name, instanceId]);

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

  // Check for price changes to force trade value recalculation
  useEffect(() => {
    if (prevPriceRef.current !== item.price) {
      console.log(`TradeInItem [${instanceId}]: Price changed from ${prevPriceRef.current} to ${item.price} for ${item.card.name}`);
      prevPriceRef.current = item.price;
      
      // Log what we currently have
      console.log(`TradeInItem [${instanceId}]: Current values for ${item.card.name}:`, {
        price: item.price,
        cashValue: item.cashValue,
        tradeValue: item.tradeValue,
        calculatedCashValue: cashValue,
        calculatedTradeValue: tradeValue
      });
    }
  }, [item.price, item.card.name, cashValue, tradeValue, instanceId]);

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
        console.log(`TradeInItem [${instanceId}]: Notifying parent of value change for ${item.card.name}:`, {
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
  }, [cashValue, tradeValue, isCalculating, onValueChange, item.card.name, instanceId]);

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

  // Log when payment type changes for debugging
  useEffect(() => {
    console.log(`TradeInItem [${instanceId}]: Payment type for ${item.card.name} is ${item.paymentType || 'not set'}, displaying value: ${displayValue}`);
  }, [item.paymentType, displayValue, item.card.name, instanceId]);

  // Handle manual value adjustments if needed
  const handleValueAdjustment = useCallback((value: number) => {
    console.log(`TradeInItem [${instanceId}]: Manual value adjustment for ${item.card.name}: ${value}`);
    if (onValueAdjustment) {
      onValueAdjustment(value);
    }
  }, [item.card.name, onValueAdjustment, instanceId]);

  // Force price refresh if we have a card without a price but with a productId
  useEffect(() => {
    if (item.price <= 0 && item.card.productId && !item.isLoadingPrice && initialRender.current) {
      console.log(`TradeInItem [${instanceId}]: Card ${item.card.name} has productId but no price, triggering refresh`);
      refreshPrice();
    }
  }, [item.price, item.card.productId, item.isLoadingPrice, refreshPrice, item.card.name, instanceId]);

  // Get game type with default or assert it's valid
  const gameType = item.card.game || 'pokemon' as GameType;

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
        usedFallback={item.usedFallback}
        fallbackReason={item.fallbackReason}
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
      
      {/* Debug information panel - uncomment if needed */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-1 space-y-1">
              <div><span className="font-medium">Price:</span> ${item.price?.toFixed(2)}</div>
              <div><span className="font-medium">Cash Value:</span> ${cashValue?.toFixed(2)}</div>
              <div><span className="font-medium">Trade Value:</span> ${tradeValue?.toFixed(2)}</div>
              <div><span className="font-medium">Game:</span> {item.card.game || 'Unknown'}</div>
              <div><span className="font-medium">Payment Type:</span> {item.paymentType || 'Not selected'}</div>
              {error && <div className="text-red-500"><span className="font-medium">Error:</span> {error}</div>}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default TradeInItem;
