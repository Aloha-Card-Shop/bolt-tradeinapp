
import { useState, useEffect } from 'react';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
  error?: string;
}

export function useTradeValue(
  game?: string,
  baseValue?: number
): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!baseValue || baseValue <= 0) {
      setCashValue(0);
      setTradeValue(0);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    fetch('/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, baseValue }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Calculation failed');
        }
        return res.json();
      })
      .then(({ cashValue, tradeValue }: { cashValue: number; tradeValue: number }) => {
        // Use the values directly from the API
        setCashValue(cashValue);
        setTradeValue(tradeValue);
      })
      .catch((err: Error) => {
        console.error('useTradeValue error:', err);
        setError(err.message);
        setCashValue(0);
        setTradeValue(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading, error };
}
