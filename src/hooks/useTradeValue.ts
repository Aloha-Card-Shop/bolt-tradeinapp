
import { useState, useEffect } from 'react';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
  error?: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

/**
 * Hook to calculate trade-in values based on game type and base value using admin settings
 */
export function useTradeValue(
  game?: string,
  baseValue?: number
): TradeValueHookReturn {
  console.log(`[useTradeValue] Calculating trade values for game=${game}, baseValue=${baseValue}`);
  
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string>();

  useEffect(() => {
    if (!baseValue || baseValue <= 0 || !game) {
      setCashValue(0);
      setTradeValue(0);
      setUsedFallback(false);
      setFallbackReason(undefined);
      setError(undefined);
      return;
    }

    const calculateValues = async () => {
      setIsLoading(true);
      setError(undefined);
      
      try {
        const response = await fetch('/api/calculate-value', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            game,
            baseValue,
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        
        setCashValue(data.cashValue || 0);
        setTradeValue(data.tradeValue || 0);
        setUsedFallback(data.usedFallback || false);
        setFallbackReason(data.fallbackReason);
        
        console.log(`[useTradeValue] API Result → cashValue: ${data.cashValue}, tradeValue: ${data.tradeValue}, usedFallback: ${data.usedFallback}`);
        
      } catch (err) {
        console.error('[useTradeValue] API call failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate trade values');
        
        // Fallback to basic calculation if API fails
        const fallbackCashValue = parseFloat((baseValue * 0.35).toFixed(2));
        const fallbackTradeValue = parseFloat((baseValue * 0.5).toFixed(2));
        
        setCashValue(fallbackCashValue);
        setTradeValue(fallbackTradeValue);
        setUsedFallback(true);
        setFallbackReason('API unavailable - using default percentages');
      } finally {
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue]);

  return { 
    cashValue, 
    tradeValue, 
    isLoading, 
    error, 
    usedFallback, 
    fallbackReason 
  };
}
