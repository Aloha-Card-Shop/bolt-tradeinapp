
import { useEffect, useRef, useState } from 'react';
import { TradeInItem } from '../useTradeInList';
import { useTradeValue } from '../useTradeValue';
import { usePriceManagement } from './usePriceManagement';
import { useValueTracking } from './useValueTracking';
import { useItemPriceValidation } from './useItemPriceValidation';
import { useInitialCalculation } from './useInitialCalculation';
import { useItemPriceLogger } from './useItemPriceLogger';

interface UseItemPriceProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useItemPrice = ({ item, onUpdate }: UseItemPriceProps) => {
  // Generate a unique ID for this hook instance to track in logs
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  
  // Set up logging
  const logger = useItemPriceLogger(instanceId, item);
  logger.logInitialization();
  
  // Validate inputs
  const { validGame, validPrice } = useItemPriceValidation(item, instanceId);
  
  // Get standard calculated values from the trade value hook with explicit type
  const { 
    cashValue: calculatedCashValue, 
    tradeValue: calculatedTradeValue, 
    isLoading,
    error: calculationError,
    usedFallback,
    fallbackReason
  } = useTradeValue(
    validGame ? item.card.game : 'pokemon', // Default to pokemon if no game type
    validPrice ? item.price : 0 // Only pass valid prices
  );
  
  // Track value changes
  const { 
    prevCalculatedCashValue,
    prevCalculatedTradeValue,
    valuesChanged
  } = useValueTracking(calculatedCashValue, calculatedTradeValue);
  
  // Handle initial calculation state
  const { 
    initialCalculationState, 
    setInitialCalculation 
  } = useInitialCalculation({ item, onUpdate });
  
  // Track if market price has been set
  const [marketPriceSet, setMarketPriceSet] = useState<boolean>(false);
  
  // Use the manually set values if they exist, otherwise use the calculated values
  const cashValue = item.cashValue !== undefined ? item.cashValue : calculatedCashValue;
  const tradeValue = item.tradeValue !== undefined ? item.tradeValue : calculatedTradeValue;
  
  // For display in UI
  const [displayValue, setDisplayValue] = useState(0);
  
  // Use effect to update and log trade value data
  useEffect(() => {
    logger.logTradeValueData({
      calculatedCashValue,
      calculatedTradeValue,
      isLoading,
      calculationError,
      usedFallback,
      fallbackReason,
      initialCalculationState,
      cashValueDefined: item.cashValue !== undefined,
      tradeValueDefined: item.tradeValue !== undefined
    });
  }, [
    calculatedCashValue, calculatedTradeValue, isLoading, calculationError, 
    usedFallback, fallbackReason, initialCalculationState,
    item.cashValue, item.tradeValue, logger
  ]);
  
  // Calculate the display value and update item values when needed
  useEffect(() => {
    import('./utils/valueCalculation').then(({ calculateDisplayValue, createValueUpdates }) => {
      const shouldCalculate = !isLoading && 
                            item.price > 0 && 
                            (initialCalculationState || 
                             item.initialCalculation ||
                             item.cashValue === undefined || 
                             item.tradeValue === undefined ||
                             (item.paymentType === 'cash' && valuesChanged()));
      
      logger.logCalculationDecision({
        cashValue,
        tradeValue,
        isLoading,
        paymentType: item.paymentType,
        initialCalculation: initialCalculationState,
        shouldCalculate
      });
      
      // Update display value
      setDisplayValue(calculateDisplayValue(item.paymentType, cashValue, tradeValue, item.quantity));
      
      // Force calculation based on the shouldCalculate criteria
      if (shouldCalculate) {
        logger.logForceCalculation({
          calculatedCash: calculatedCashValue,
          prevCalcCash: prevCalculatedCashValue.current,
          calculatedTrade: calculatedTradeValue,
          prevCalcTrade: prevCalculatedTradeValue.current,
          isInitial: initialCalculationState,
          itemInitial: item.initialCalculation,
          hasManualCashValue: item.cashValue !== undefined,
          hasManualTradeValue: item.tradeValue !== undefined,
          paymentType: item.paymentType
        });
        
        // Store new calculated values in refs
        prevCalculatedCashValue.current = calculatedCashValue;
        prevCalculatedTradeValue.current = calculatedTradeValue;
        
        if (initialCalculationState) {
          setInitialCalculation(false);
        }
        
        // Get updates based on calculation results
        const updates = createValueUpdates(
          item, 
          calculatedCashValue, 
          calculatedTradeValue, 
          calculationError,
          usedFallback,
          fallbackReason,
          marketPriceSet
        );
        
        // Only update if we have changes to make
        if (Object.keys(updates).length > 0) {
          logger.logUpdates(updates);
          onUpdate(updates);
          
          // Update marketPriceSet if we're setting payment type
          if (updates.paymentType === 'cash') {
            setMarketPriceSet(true);
          }
        }
      }
    });
  }, [
    calculatedCashValue, calculatedTradeValue, isLoading, item.price, item.quantity,
    item.cashValue, item.tradeValue, item.paymentType, onUpdate, cashValue, tradeValue,
    item.card.name, calculationError, usedFallback, fallbackReason, instanceId,
    initialCalculationState, marketPriceSet, item.initialCalculation, setInitialCalculation, item,
    valuesChanged, logger
  ]);

  // Price management functionality
  const { refreshPrice, handlePriceChange } = usePriceManagement({
    item,
    onUpdate,
    instanceId,
    setMarketPriceSet,
    setInitialCalculation
  });

  // Force price refresh if we have a card without a price but with a productId
  useEffect(() => {
    if (item.price <= 0 && item.card.productId && !item.isLoadingPrice && (initialCalculationState || item.initialCalculation)) {
      logger.logPriceRefresh();
      refreshPrice();
    }
  }, [item.price, item.card.productId, item.isLoadingPrice, refreshPrice, 
      initialCalculationState, item.initialCalculation, logger]);

  // Explicitly log the return values
  const returnValues = {
    displayValue,
    isCalculating: isLoading,
    refreshPrice,
    handlePriceChange,
    cashValue,
    tradeValue,
    error: calculationError,
    usedFallback,
    fallbackReason
  };

  logger.logReturnValues(returnValues);

  return returnValues;
};
