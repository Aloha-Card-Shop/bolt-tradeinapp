
import React, { useCallback, useState } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemContent from './ItemContent';
import { useComponentLogger } from '../../../hooks/trade-in/useComponentLogger';
import { useDebugInfo } from '../../../hooks/trade-in/useDebugInfo';
import { useTradeInItemHandlers } from '../../../hooks/trade-in/handlers/useTradeInItemHandlers';
import { useCardVariantAvailability } from '../../../hooks/useCardVariantAvailability';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  onValueAdjustment?: (value: number) => void;
  hideDetailedPricing?: boolean;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange,
  onValueAdjustment,
  hideDetailedPricing = false
}) => {
  // Use the logger hook
  const { instanceId } = useComponentLogger('TradeInItem', item, index);
  
  // Use the variant availability hook
  const { availability, isLoading: isLoadingAvailability } = useCardVariantAvailability(item.card);
  
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
    refreshPrice,
    handleConditionChangeWrapper,
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity,
    handlePriceChangeWrapper
  } = useTradeInItemHandlers({
    item,
    index,
    onUpdate,
    onValueChange,
    instanceId
  });

  // Get debug information - ensure we have valid values
  const { isDebugMode, debugInfo } = useDebugInfo(item, cashValue || 0, tradeValue || 0, error);

  // Handle condition changes, passing through to the parent
  const handleConditionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const wrappedEvent = handleConditionChangeWrapper(e);
    onConditionChange(wrappedEvent.target.value);
  }, [handleConditionChangeWrapper, onConditionChange]);

  // Handle manual value adjustments if needed
  const handleValueAdjustment = useCallback((value: number) => {
    console.log(`TradeInItem [${instanceId}]: Manual value adjustment for ${item.card.name}: ${value}`);
    if (onValueAdjustment) {
      onValueAdjustment(value);
    }
  }, [item.card.name, onValueAdjustment, instanceId]);

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
            handleConditionChange={handleConditionChange}
            updateQuantity={updateQuantity}
            toggleFirstEdition={toggleFirstEdition}
            toggleHolo={toggleHolo}
            toggleReverseHolo={toggleReverseHolo}
            updatePaymentType={updatePaymentType}
            handlePriceChange={handlePriceChangeWrapper}
            refreshPrice={refreshPrice}
            onValueAdjustment={handleValueAdjustment}
            isDebugMode={isDebugMode}
            debugInfo={debugInfo}
            hideDetailedPricing={hideDetailedPricing}
            availability={availability}
            isLoadingAvailability={isLoadingAvailability}
          />
        </div>
      )}
      
      {/* Show collapsed state message for certified cards */}
      {isCertified && isCollapsed && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-accordion-down">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Quantity: <span className="font-medium">{item.quantity}</span></span>
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
