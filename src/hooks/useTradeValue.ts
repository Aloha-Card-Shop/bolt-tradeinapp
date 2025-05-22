
import { useState, useEffect } from 'react';
import { useTradeCalculator } from './trade-in/useTradeCalculator';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
  error?: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

/**
 * Hook to calculate trade-in values based on game type and base value
 */
export function useTradeValue(
  game?: string,
  baseValue?: number,
  showToast: boolean = false
): TradeValueHookReturn {
  console.log(`[useTradeValue] Calculating trade values for game=${game}, baseValue=${baseValue}`);
  
  const [error, setError] = useState<string>();
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string>();

  // Use the calculator hook for core calculation logic
  const { cashValue, tradeValue, isLoading } = useTradeCalculator(baseValue, game);

  useEffect(() => {
    if (!baseValue || baseValue <= 0) {
      setUsedFallback(false);
      setFallbackReason(undefined);
      setError(undefined);
      return;
    }

    // Reset error/fallback states
    setError(undefined);
    
    // Simplified implementation - no longer using fallback since direct calculation
    // is now the primary path
    setUsedFallback(false);
    setFallbackReason(undefined);
    
  }, [game, baseValue, showToast]);

  // Log results before returning
  console.log(`[useTradeValue] Result → cashValue: ${cashValue}, tradeValue: ${tradeValue}`);
  
  return { 
    cashValue, 
    tradeValue, 
    isLoading, 
    error, 
    usedFallback, 
    fallbackReason 
  };
}
