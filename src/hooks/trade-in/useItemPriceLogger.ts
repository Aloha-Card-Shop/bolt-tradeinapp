
import { TradeInItem } from '../useTradeInList';
import { useCallback } from 'react';

export function useItemPriceLogger(instanceId: string, item: TradeInItem) {
  const logInitialization = useCallback(() => {
    console.log(`useItemPrice [${instanceId}]: Initializing for card ${item.card.name}`, {
      game: item.card.game,
      price: item.price,
      paymentType: item.paymentType,
      cardData: item.card,
      initialCalculation: item.initialCalculation
    });
  }, [instanceId, item.card, item.price, item.paymentType, item.initialCalculation]);
  
  const logTradeValueData = useCallback((data: {
    calculatedCashValue: number;
    calculatedTradeValue: number;
    isLoading: boolean;
    calculationError?: string;
    usedFallback: boolean;
    fallbackReason?: string;
    initialCalculationState: boolean;
    cashValueDefined: boolean;
    tradeValueDefined: boolean;
  }) => {
    console.log(`useItemPrice [${instanceId}]: Trade value hook returned values for ${item.card.name}:`, {
      ...data,
      currentPrice: item.price,
      gameType: item.card.game,
      itemInitialCalculation: item.initialCalculation
    });
    
    // Only show error toast for critical errors, not for price range mismatches or API not found
    if (data.calculationError && 
        !data.isLoading && 
        !data.calculationError.includes('price range found') &&
        data.calculationError !== 'API_ENDPOINT_NOT_FOUND') {
      // Toast error handling moved to component
    }
  }, [instanceId, item.card.name, item.price, item.card.game, item.initialCalculation]);
  
  const logCalculationDecision = useCallback((data: {
    cashValue: number;
    tradeValue: number;
    isLoading: boolean;
    paymentType: 'cash' | 'trade' | null;
    initialCalculation: boolean;
    shouldCalculate: boolean;
  }) => {
    console.log(`useItemPrice [${instanceId}]: Effect triggered with cashValue=${data.cashValue}, tradeValue=${data.tradeValue}, isLoading=${data.isLoading}, paymentType=${data.paymentType}, initialCalculation=${data.initialCalculation}, shouldCalculate=${data.shouldCalculate}`);
  }, [instanceId]);
  
  const logForceCalculation = useCallback((data: {
    calculatedCash: number;
    prevCalcCash: number;
    calculatedTrade: number;
    prevCalcTrade: number;
    isInitial: boolean;
    itemInitial?: boolean;
    hasManualCashValue: boolean;
    hasManualTradeValue: boolean;
    paymentType: 'cash' | 'trade' | null;
  }) => {
    console.log(`useItemPrice [${instanceId}]: Forcing value calculation for ${item.card.name}`, {
      card: item.card.name,
      ...data
    });
  }, [instanceId, item.card.name]);
  
  const logUpdates = useCallback((updates: Partial<TradeInItem>) => {
    console.log(`useItemPrice [${instanceId}]: Updating ${item.card.name} with calculated values:`, updates);
  }, [instanceId, item.card.name]);
  
  const logPriceRefresh = useCallback(() => {
    console.log(`useItemPrice [${instanceId}]: Card ${item.card.name} has productId but no price, triggering refresh`);
  }, [instanceId, item.card.name]);
  
  const logReturnValues = useCallback((returnValues: any) => {
    console.log(`useItemPrice [${instanceId}]: Returning values for ${item.card.name}:`, returnValues);
  }, [instanceId, item.card.name]);
  
  return {
    logInitialization,
    logTradeValueData,
    logCalculationDecision,
    logForceCalculation,
    logUpdates,
    logPriceRefresh,
    logReturnValues
  };
}
