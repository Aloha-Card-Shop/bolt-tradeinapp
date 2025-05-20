// src/hooks/useTradeValue.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  game?: GameType,
  baseValue?: number
): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);

    // short-circuit invalid baseValue
    if (!baseValue || baseValue <= 0) {
      setCashValue(0);
      setTradeValue(0);
      setIsLoading(false);
      return;
    }

    const calculateValues = async () => {
      setIsLoading(true);
      try {
        const numericBase = Number(baseValue);
        if (isNaN(numericBase) || numericBase <= 0) {
          throw new Error(`Invalid baseValue: ${baseValue}`);
        }

        const gameKey = normalizeGameType(game) || 'pokemon';

        // 1) fetch all settings for this game in one shot
        const { data: allSettings, error: fetchErr } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', gameKey);

        if (fetchErr) throw fetchErr;

        // 2) if no settings, fallback defaults
        if (!allSettings || allSettings.length === 0) {
          setError(`No settings for "${gameKey}", using defaults.`);
          setCashValue(Math.round(numericBase * 0.5 * 100) / 100);
          setTradeValue(Math.round(numericBase * 0.65 * 100) / 100);
          return;
        }

        // 3) fixed override?
        const fixed = allSettings.find(
          s => s.fixed_cash_value != null && s.fixed_trade_value != null
        );
        if (fixed) {
          setCashValue(fixed.fixed_cash_value!);
          setTradeValue(fixed.fixed_trade_value!);
          return;
        }

        // 4) percentage-based range match
        const range = allSettings.find(
          s => numericBase >= s.min_value && numericBase <= s.max_value
        );
        if (range) {
          const cv = numericBase * (range.cash_percentage / 100);
          const tv = numericBase * (range.trade_percentage / 100);
          setCashValue(Math.round(cv * 100) / 100);
          setTradeValue(Math.round(tv * 100) / 100);
          return;
        }

        // 5) no bracket matched → fallback-percentages
        setError(
          `No range for $${numericBase.toFixed(2)}, using default percentages.`
        );
        setCashValue(Math.round(numericBase * 0.5 * 100) / 100);
        setTradeValue(Math.round(numericBase * 0.65 * 100) / 100);

      } catch (err: any) {
        console.error('useTradeValue error:', err);
        // fallback on error
        const fallbackCash = Number(baseValue) * 0.5;
        const fallbackTrade = Number(baseValue) * 0.65;
        setError(`Error calculating values, using defaults.`);
        setCashValue(Math.round(fallbackCash * 100) / 100);
        setTradeValue(Math.round(fallbackTrade * 100) / 100);
        toast.error(`Calculation failed: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading, error };
}
