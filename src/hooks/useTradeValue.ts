import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GameType } from '../types/card';

interface TradeValueHookReturn {
  cashValue: number;
  tradeValue: number;
  isLoading: boolean;
}

export function useTradeValue(game?: GameType, baseValue?: number): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!game || !baseValue || baseValue <= 0) {
      setCashValue(0);
      setTradeValue(0);
      return;
    }

    const calculateValues = async () => {
      setIsLoading(true);
      try {
        const { data: settings } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', game)
          .lte('min_value', baseValue)
          .gte('max_value', baseValue)
          .order('min_value', { ascending: false })
          .limit(1);

        if (settings?.[0]) {
          const setting = settings[0];
          if (setting.fixed_cash_value != null && setting.fixed_trade_value != null) {
            setCashValue(setting.fixed_cash_value);
            setTradeValue(setting.fixed_trade_value);
          } else {
            setCashValue(baseValue * (setting.cash_percentage / 100));
            setTradeValue(baseValue * (setting.trade_percentage / 100));
          }
        } else {
          // Default values if no setting found
          setCashValue(baseValue * 0.5);
          setTradeValue(baseValue * 0.65);
        }
      } catch (error) {
        console.error('Error calculating trade values:', error);
        // Fallback to default values
        setCashValue(baseValue * 0.5);
        setTradeValue(baseValue * 0.65);
      } finally {
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading };
}