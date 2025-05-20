
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES } from '../constants/fallbackValues';

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
      return;
    }

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
          throw new Error(payload.error || 'Calculation failed');
        }
        return res.json();
      })
      .then(({ cashValue, tradeValue, usedFallback: didUseFallback, fallbackReason: reason }: { 
        cashValue: number; 
        tradeValue: number;
        usedFallback?: boolean;
        fallbackReason?: string;
      }) => {
        // Set the values from the API
        setCashValue(cashValue);
        setTradeValue(tradeValue);
        
        // Track if we used fallbacks
        setUsedFallback(!!didUseFallback);
        setFallbackReason(reason);
        
        // Show toast notification if fallback was used and toasts are enabled
        if (didUseFallback && showToast) {
          const errorMessage = ERROR_MESSAGES[reason as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.CALCULATION_FAILED;
          toast.error(errorMessage, {
            id: `fallback-${game}-${baseValue}`, // Prevent duplicate toasts
            duration: 4000
          });
          
          // For admin users, show more details
          const isAdmin = localStorage.getItem('user_role') === 'admin';
          if (isAdmin) {
            toast.error(`Admin info: Fallback used for ${game}, value $${baseValue}, reason: ${reason}`, {
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
        setCashValue(0);
        setTradeValue(0);
        
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
  }, [game, baseValue, showToast]);

  return { cashValue, tradeValue, isLoading, error, usedFallback, fallbackReason };
}
