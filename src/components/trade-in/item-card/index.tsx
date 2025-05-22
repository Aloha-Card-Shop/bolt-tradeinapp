
import React, { useCallback, useEffect, useRef } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import { useItemPrice } from '../../../hooks/trade-in/useItemPrice';
import { useCardAttributes } from '../../../hooks/trade-in/useCardAttributes';
import { useComponentLogger } from '../../../hooks/trade-in/useComponentLogger';
import { useDebugInfo } from '../../../hooks/trade-in/useDebugInfo';
import WarningMessages from './WarningMessages';
import DebugPanel from './DebugPanel';

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
  // Use the logger hook
  const { instanceId } = useComponentLogger('TradeInItem', item, index);
  
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

  // Get debug information
  const { isDebugMode, debugInfo } = useDebugInfo(item, cashValue, tradeValue, error);

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

  // Fix: Make the handlePriceChange function accept the event format expected by ItemValues
  const handlePriceChangeWrapper = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value);
    if (!isNaN(newPrice)) {
      handlePriceChange(newPrice);
    }
  }, [handlePriceChange]);

  // Force price refresh if we have a card without a price but with a productId
  useEffect(() => {
    if (item.price <= 0 && item.card.productId && !item.isLoadingPrice && initialRender.current) {
      console.log(`TradeInItem [${instanceId}]: Card ${item.card.name} has productId but no price, triggering refresh`);
      refreshPrice();
    }
  }, [item.price, item.card.productId, item.isLoadingPrice, refreshPrice, item.card.name, instanceId]);

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
        onPriceChange={handlePriceChangeWrapper}
        onRefreshPrice={refreshPrice}
        isPriceUnavailable={item.isPriceUnavailable}
        onValueAdjustment={handleValueAdjustment}
        usedFallback={item.usedFallback}
        fallbackReason={item.fallbackReason}
      />
      
      <WarningMessages 
        card={item.card}
        price={item.price}
      />
      
      <DebugPanel 
        isVisible={isDebugMode}
        debugInfo={debugInfo}
      />
    </div>
  );
};

export default TradeInItem;
