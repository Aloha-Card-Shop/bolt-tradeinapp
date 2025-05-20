// src/hooks/useTradeValue.ts
import { useState, useEffect } from 'react';
import { GameType } from '../types/card';
import { toast } from 'react-hot-toast';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
  error?: string;
}

// Helper function to normalize game type strings
const normalizeGameType = (gameType?: string): GameType | undefined => {
  if (!gameType) return undefined;
  const normalized = gameType.toLowerCase().trim();
  if (['pokémon', 'pokemon'].includes(normalized)) return 'pokemon';
  if (
    ['japanese-pokemon', 'japanese pokemon', 'pokemon (japanese)', 'pokemon japanese']
      .includes(normalized)
  ) return 'japanese-pokemon';
  if (
    ['magic', 'magic: the gathering', 'mtg', 'magic the gathering']
      .includes(normalized)
  ) return 'magic';
  // fallback
  return ['pokemon', 'japanese-pokemon', 'magic'].includes(normalized as GameType)
    ? (normalized as GameType)
    : 'pokemon';
};

export function useTradeValue(
  game?: GameType | string,
  baseValue?: number
): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Clear previous errors
    setError(undefined);

    // If no baseValue or it's not positive, return zeros immediately
    if (!baseValue || baseValue <= 0) {
      setCashValue(0);
      setTradeValue(0);
      return;
    }

    // Otherwise, make the API call
    const fetchTradeValues = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/calculate-value', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ game, baseValue }),
        });

        // Check if response is OK
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        // Parse response data
        const data = await response.json();
        
        // Update values
        setCashValue(data.cashValue);
        setTradeValue(data.tradeValue);
      } catch (err: any) {
        console.error('Error calculating trade values:', err);
        setError(err.message || 'Failed to calculate trade values');
        toast.error(`Calculation error: ${err.message || 'Unknown error'}`);
        
        // Set default values on error
        setCashValue(0);
        setTradeValue(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading, error };
}
