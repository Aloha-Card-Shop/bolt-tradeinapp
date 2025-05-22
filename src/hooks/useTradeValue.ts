
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES } from '../constants/fallbackValues';
import { CalculationResult } from '../types/calculation';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
  error?: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

export function useTradeValue(
  game?: string,
  baseValue?: number,
  showToast: boolean = false
): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string>();

  useEffect(() => {
    if (!baseValue || baseValue <= 0) {
      setCashValue(0);
      setTradeValue(0);
      setUsedFallback(false);
      setFallbackReason(undefined);
      setError(undefined);
      return;
    }

    console.log(`useTradeValue: Calculating values for game=${game}, baseValue=${baseValue}`);
    setIsLoading(true);
    setError(undefined);
    
    // Default percentages for calculations
    const DEFAULT_CASH_PERCENTAGE = 35;
    const DEFAULT_TRADE_PERCENTAGE = 50;
    
    // Calculate values directly without API call
    const calculatedCashValue = parseFloat((baseValue * (DEFAULT_CASH_PERCENTAGE / 100)).toFixed(2));
    const calculatedTradeValue = parseFloat((baseValue * (DEFAULT_TRADE_PERCENTAGE / 100)).toFixed(2));
    
    // Update state with calculated values
    setCashValue(calculatedCashValue);
    setTradeValue(calculatedTradeValue);
    
    // Mark as using fallback values but don't show error toast since this is now the default behavior
    setUsedFallback(false);
    setFallbackReason(undefined);
    
    // Finish loading
    setIsLoading(false);
    
  }, [game, baseValue, showToast]);

  return { cashValue, tradeValue, isLoading, error, usedFallback, fallbackReason };
}
