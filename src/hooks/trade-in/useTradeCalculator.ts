
import { useState, useEffect } from 'react';

interface TradeCalculationResult {
  cashValue: number;
  tradeValue: number;
}

// Constants for fallback percentages
const DEFAULT_CASH_PERCENTAGE = 35;
const DEFAULT_TRADE_PERCENTAGE = 50;

/**
 * Calculate trade and cash values based on base value and percentages
 */
export function calculateTradeValues(
  baseValue: number,
  cashPercentage: number = DEFAULT_CASH_PERCENTAGE,
  tradePercentage: number = DEFAULT_TRADE_PERCENTAGE
): TradeCalculationResult {
  if (!baseValue || baseValue <= 0) {
    return { cashValue: 0, tradeValue: 0 };
  }
  
  const calculatedCashValue = parseFloat((baseValue * (cashPercentage / 100)).toFixed(2));
  const calculatedTradeValue = parseFloat((baseValue * (tradePercentage / 100)).toFixed(2));
  
  return {
    cashValue: calculatedCashValue,
    tradeValue: calculatedTradeValue
  };
}

/**
 * Hook for calculating trade values with dynamic state management
 */
export function useTradeCalculator(
  baseValue?: number,
  game?: string,
) {
  const [values, setValues] = useState<TradeCalculationResult>({ cashValue: 0, tradeValue: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!baseValue || baseValue <= 0) {
      setValues({ cashValue: 0, tradeValue: 0 });
      return;
    }

    setIsLoading(true);
    
    // Calculate values using default percentages
    const result = calculateTradeValues(baseValue);
    setValues(result);
    setIsLoading(false);
  }, [baseValue, game]);

  return {
    ...values,
    isLoading
  };
}
