
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
        // Query for matching trade value settings
        // FIX: Changed gte('max_value', baseValue) to lte('max_value', baseValue)
        // This ensures we find settings where min_value <= baseValue <= max_value
        const { data: settings } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', game)
          .lte('min_value', baseValue)
          .gte('max_value', baseValue)
          .order('min_value', { ascending: false })
          .limit(1);

        console.log(`Trade value lookup: game=${game}, baseValue=${baseValue}`, settings);

        if (settings?.[0]) {
          const setting = settings[0];
          // Check if fixed values are provided
          if (setting.fixed_cash_value != null && setting.fixed_trade_value != null) {
            // Use fixed values directly
            setCashValue(setting.fixed_cash_value);
            setTradeValue(setting.fixed_trade_value);
          } else {
            // Calculate based on percentages
            const calculatedCashValue = baseValue * (setting.cash_percentage / 100);
            const calculatedTradeValue = baseValue * (setting.trade_percentage / 100);
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
            
            console.log(`Calculated values based on percentages:`, {
              cashPercentage: setting.cash_percentage,
              tradePercentage: setting.trade_percentage,
              cashValue: calculatedCashValue,
              tradeValue: calculatedTradeValue
            });
          }
        } else {
          // Default values if no setting found
          const defaultCashValue = baseValue * 0.5;
          const defaultTradeValue = baseValue * 0.65;
          setCashValue(defaultCashValue);
          setTradeValue(defaultTradeValue);
          
          console.log(`No matching settings found. Using default values:`, {
            cashValue: defaultCashValue,
            tradeValue: defaultTradeValue
          });
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
