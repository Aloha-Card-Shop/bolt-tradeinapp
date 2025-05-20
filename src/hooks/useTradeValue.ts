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
  showToast: boolean = true
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
    setUsedFallback(false);
    setFallbackReason(undefined);

    // Get the current user ID if available
    const userId = localStorage.getItem('supabase.auth.token')
      ? JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.currentSession?.user?.id
      : undefined;

    fetch('/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, baseValue, userId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          console.error('useTradeValue: API request failed', { status: res.status, payload });
          throw new Error(payload.error || `API returned ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: CalculationResult) => {
        console.log(`useTradeValue: Received data for game=${game}, baseValue=${baseValue}:`, data);
        
        // Set the values from the API
        setCashValue(data.cashValue || 0);
        setTradeValue(data.tradeValue || 0);
        
        // Track if we used fallbacks
        setUsedFallback(!!data.usedFallback);
        setFallbackReason(data.fallbackReason);
        
        // Set error if present in response
        if (data.error) {
          console.warn(`useTradeValue: Error in response: ${data.error}`);
          setError(data.error);
        }
        
        // Show toast notification if fallback was used and toasts are enabled
        if (data.usedFallback && showToast) {
          const errorMessage = ERROR_MESSAGES[data.fallbackReason as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.CALCULATION_FAILED;
          toast.error(errorMessage, {
            id: `fallback-${game}-${baseValue}`, // Prevent duplicate toasts
            duration: 4000
          });
          
          // For admin users, show more details
          const isAdmin = localStorage.getItem('user_role') === 'admin';
          if (isAdmin) {
            toast.error(`Admin info: Fallback used for ${game}, value $${baseValue}, reason: ${data.fallbackReason}`, {
              id: `fallback-admin-${game}-${baseValue}`,
              duration: 5000
            });
          }
        }
      })
      .catch((err: Error) => {
        console.error('useTradeValue error:', err);
        setError(err.message);
        setUsedFallback(true);
        setFallbackReason('API_ERROR');
        
        // Keep any previously calculated values rather than resetting to 0
        // This improves user experience if the API errors during a later calculation
        if (cashValue === 0 && tradeValue === 0) {
          // Only if we don't have any values at all, use fallbacks
          setCashValue(baseValue * (35 / 100)); // 35% fallback
          setTradeValue(baseValue * (50 / 100)); // 50% fallback
        }
        
        if (showToast) {
          toast.error(ERROR_MESSAGES.CALCULATION_FAILED, {
            id: `error-${game}-${baseValue}`,
            duration: 4000
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [game, baseValue, showToast, cashValue, tradeValue]);

  return { cashValue, tradeValue, isLoading, error, usedFallback, fallbackReason };
}
