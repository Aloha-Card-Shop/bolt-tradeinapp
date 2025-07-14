
import React, { useCallback, useState } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemContent from './ItemContent';
import { useComponentLogger } from '../../../hooks/trade-in/useComponentLogger';
import { useDebugInfo } from '../../../hooks/trade-in/useDebugInfo';
import { useTradeInItemHandlers } from '../../../hooks/trade-in/handlers/useTradeInItemHandlers';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  onValueAdjustment?: (valueType: 'cash' | 'trade', value: number) => void;
  onMarketPriceChange?: (price: number) => void;
  hideDetailedPricing?: boolean;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onValueChange,
  onValueAdjustment,
  onMarketPriceChange,
  hideDetailedPricing = false
}) => {
  // Use the logger hook
  const { instanceId } = useComponentLogger('TradeInItem', item, index);
  
  // State for collapsible functionality (only for certified cards)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCertified = item.card.isCertified;
  
  // Use our new custom hook to handle all item-related logic
  const {
    displayValue,
    isCalculating,
    error,
    cashValue,
    tradeValue,
    updatePaymentType,
    updateQuantity,
    handleMarketPriceChange: handleMarketPriceChangeFromHook
  } = useTradeInItemHandlers({
    item,
    index,
    onUpdate,
    onValueChange,
    instanceId
  });

  // Get debug information - ensure we have valid values
  const { isDebugMode, debugInfo } = useDebugInfo(item, cashValue || 0, tradeValue || 0, error);


  // Handle manual value adjustments with reverse calculation (trade values only)
  const handleValueAdjustment = useCallback(async (valueType: 'cash' | 'trade', value: number) => {
    console.log(`TradeInItem [${instanceId}]: Manual value adjustment for ${item.card.name}: ${valueType} = ${value}`);
    
    // Only allow trade value adjustments - cash should be calculated from market price
    if (valueType !== 'trade') {
      console.warn(`TradeInItem [${instanceId}]: Cash value editing is disabled. Edit market price instead.`);
      return;
    }
    
    // First, call the original adjustment handler
    if (onValueAdjustment) {
      onValueAdjustment(valueType, value);
    }
    
    // Reverse calculate the implied market price for trade values
    try {
      // Default trade percentage (should come from settings but for now use default)
      const defaultTradePercentage = 0.65; // 65%
      
      const impliedMarketPrice = value / defaultTradePercentage;
      
      console.log(`TradeInItem [${instanceId}]: Reverse calculated market price: ${impliedMarketPrice} for trade value: ${value}`);
      
      // Update the market price which will trigger recalculation of cash value
      const updatedItem: TradeInItemType = {
        ...item,
        price: impliedMarketPrice,
        // Set the manually adjusted trade value
        tradeValue: value,
        tradeValueManuallySet: true,
        // Clear cash value to force recalculation from new market price
        cashValue: undefined,
        cashValueManuallySet: false,
        // Mark as needing calculation
        initialCalculation: false
      };
      
      onUpdate(index, updatedItem);
    } catch (error) {
      console.error(`TradeInItem [${instanceId}]: Error reverse calculating market price:`, error);
    }
  }, [item, index, onUpdate, onValueAdjustment, instanceId]);

  // Handle market price changes - use prop if available, otherwise delegate to hook
  const handleMarketPriceChange = useCallback((newPrice: number) => {
    console.log(`TradeInItem [${instanceId}]: Market price change to ${newPrice}, using ${onMarketPriceChange ? 'prop handler' : 'hook handler'}`);
    if (onMarketPriceChange) {
      onMarketPriceChange(newPrice);
    } else {
      handleMarketPriceChangeFromHook(newPrice);
    }
  }, [onMarketPriceChange, handleMarketPriceChangeFromHook, instanceId]);

  // Toggle collapse state for certified cards
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-100 transition-colors duration-200 bg-white shadow-sm">
      <CardHeader 
        card={item.card} 
        index={index}
        onRemove={onRemove}
        isCollapsed={isCollapsed}
        onToggleCollapse={isCertified ? handleToggleCollapse : undefined}
      />
      
      {/* Only show ItemContent if not collapsed or if it's not a certified card */}
      {(!isCertified || !isCollapsed) && (
        <div className={`${isCertified ? 'animate-accordion-down' : ''}`}>
          <ItemContent 
            item={item}
            displayValue={displayValue}
            isCalculating={isCalculating}
            error={error}
            updateQuantity={updateQuantity}
            updatePaymentType={updatePaymentType}
            onValueAdjustment={handleValueAdjustment}
            onMarketPriceChange={handleMarketPriceChange}
            isDebugMode={isDebugMode}
            debugInfo={debugInfo}
            hideDetailedPricing={hideDetailedPricing}
          />
        </div>
      )}
      
      {/* Show collapsed state message for certified cards */}
      {isCertified && isCollapsed && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-accordion-down">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                <span className="font-medium text-blue-700">PSA {item.card.certification?.grade}</span> - {item.card.name}
              </span>
              <span>Qty: <span className="font-medium">{item.quantity}</span></span>
              <span>Payment: <span className="font-medium capitalize">{item.paymentType || 'Not selected'}</span></span>
              {displayValue && (
                <span>Value: <span className="font-medium">${displayValue}</span></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeInItem;
