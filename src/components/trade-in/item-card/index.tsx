
import React, { useCallback } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import CardHeader from './CardHeader';
import ItemContent from './ItemContent';
import { useComponentLogger } from '../../../hooks/trade-in/useComponentLogger';
import { useDebugInfo } from '../../../hooks/trade-in/useDebugInfo';
import { useTradeInItemHandlers } from '../../../hooks/trade-in/useTradeInItemHandlers';

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

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-blue-100 transition-colors duration-200 bg-white shadow-sm">
      <CardHeader 
        card={item.card} 
        index={index}
        onRemove={onRemove}
      />
      
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
      />
    </div>
  );
};

export default TradeInItem;
