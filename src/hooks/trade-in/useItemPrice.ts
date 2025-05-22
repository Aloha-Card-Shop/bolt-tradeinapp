
import { useCallback, useEffect, useState, useRef } from 'react';
import { TradeInItem } from '../useTradeInList';
import { useTradeValue } from '../useTradeValue';
import { usePriceManagement } from './usePriceManagement';
import { calculateDisplayValue, haveValuesChanged, createValueUpdates } from './utils/valueCalculation';
import { toast } from 'react-hot-toast';

interface UseItemPriceProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useItemPrice = ({ item, onUpdate }: UseItemPriceProps) => {
  // Generate a unique ID for this hook instance to track in logs
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  
  // Add detailed logging for debugging
  console.log(`useItemPrice [${instanceId}]: Initializing for card ${item.card.name}`, {
    game: item.card.game,
    price: item.price,
    paymentType: item.paymentType,
    cardData: item.card
  });
  
  // Validate game type and price before calculating
  const validGame = item.card.game ? true : false;
  const validPrice = item.price > 0;
  
  if (!validGame || !validPrice) {
    console.warn(`useItemPrice [${instanceId}]: Invalid input data for ${item.card.name}`, {
      validGame,
      validPrice,
      game: item.card.game,
      price: item.price
    });
  }
  
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
  
  // Track the values with refs to detect changes
  const prevCalculatedCashValue = useRef<number>(0);
  const prevCalculatedTradeValue = useRef<number>(0);
  const [initialCalculation, setInitialCalculationState] = useState<boolean>(true);
  const [marketPriceSet, setMarketPriceSet] = useState<boolean>(false);
  
  const setInitialCalculation = useCallback((value: boolean) => {
    setInitialCalculationState(value);
  }, []);
  
  // Add additional logging for the useTradeValue hook results
  useEffect(() => {
    console.log(`useItemPrice [${instanceId}]: Trade value hook returned values for ${item.card.name}:`, {
      calculatedCashValue,
      calculatedTradeValue,
      isLoading,
      hasError: !!calculationError,
      errorMessage: calculationError,
      usedFallback,
      fallbackReason,
      currentPrice: item.price,
      gameType: item.card.game
    });
    
    // Only show error toast for critical errors, not for price range mismatches or API not found
    if (calculationError && 
        !isLoading && 
        !calculationError.includes('price range found') &&
        calculationError !== 'API_ENDPOINT_NOT_FOUND') {
      toast.error(`Trade value calculation issue: ${calculationError}`);
    }
  }, [calculatedCashValue, calculatedTradeValue, isLoading, calculationError, 
      usedFallback, fallbackReason, item.card.name, item.price, item.card.game, instanceId]);
  
  // Use the manually set values if they exist, otherwise use the calculated values
  const cashValue = item.cashValue !== undefined ? item.cashValue : calculatedCashValue;
  const tradeValue = item.tradeValue !== undefined ? item.tradeValue : calculatedTradeValue;
  
  const [displayValue, setDisplayValue] = useState(0);
  
  // Calculate the display value based on payment type and force updates when needed
  useEffect(() => {
    console.log(`useItemPrice [${instanceId}]: Effect triggered with cashValue=${cashValue}, tradeValue=${tradeValue}, isLoading=${isLoading}, paymentType=${item.paymentType}, initialCalculation=${initialCalculation}`);
    
    setDisplayValue(calculateDisplayValue(item.paymentType, cashValue, tradeValue, item.quantity));
    
    // Only update the calculated values if:
    // 1. Not loading and has price
    // 2. AND it's either the initial calculation OR the calculated values have changed
    if (!isLoading && item.price > 0) {
      console.log(`useItemPrice [${instanceId}]: Checking if values changed:`, {
        card: item.card.name,
        calculatedCash: calculatedCashValue,
        prevCalcCash: prevCalculatedCashValue.current,
        calculatedTrade: calculatedTradeValue,
        prevCalcTrade: prevCalculatedTradeValue.current,
        isInitial: initialCalculation,
        hasManualCashValue: item.cashValue !== undefined,
        hasManualTradeValue: item.tradeValue !== undefined
      });
      
      // Check if values have changed or if it's forced recalculation
      const valuesChanged = haveValuesChanged(
        calculatedCashValue, 
        prevCalculatedCashValue.current, 
        calculatedTradeValue, 
        prevCalculatedTradeValue.current
      );
      
      // If it's the first calculation or values have changed or cashValue/tradeValue is undefined, update
      if (initialCalculation || valuesChanged || item.cashValue === undefined || item.tradeValue === undefined) {
        // Store new calculated values in refs
        prevCalculatedCashValue.current = calculatedCashValue;
        prevCalculatedTradeValue.current = calculatedTradeValue;
        setInitialCalculationState(false);
        
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
          console.log(`useItemPrice [${instanceId}]: Updating ${item.card.name} with calculated values:`, updates);
          onUpdate(updates);
          
          // Update marketPriceSet if we're setting payment type
          if (updates.paymentType === 'cash') {
            setMarketPriceSet(true);
          }
        }
      }
    }
  }, [
    calculatedCashValue, calculatedTradeValue, isLoading, item.price, item.quantity,
    item.cashValue, item.tradeValue, item.paymentType, onUpdate, cashValue, tradeValue,
    item.card.name, calculationError, usedFallback, fallbackReason, instanceId,
    initialCalculation, marketPriceSet
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
    if (item.price <= 0 && item.card.productId && !item.isLoadingPrice && initialCalculation) {
      console.log(`useItemPrice [${instanceId}]: Card ${item.card.name} has productId but no price, triggering refresh`);
      refreshPrice();
    }
  }, [item.price, item.card.productId, item.isLoadingPrice, refreshPrice, item.card.name, instanceId, initialCalculation]);

  // Explicitly log the return values for debugging
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

  console.log(`useItemPrice [${instanceId}]: Returning values for ${item.card.name}:`, returnValues);

  return returnValues;
};
