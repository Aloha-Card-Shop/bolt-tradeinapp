
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
      console.log(`useTradeValue: Invalid parameters - game=${game}, baseValue=${baseValue}`);
      setCashValue(0);
      setTradeValue(0);
      return;
    }

    const calculateValues = async () => {
      setIsLoading(true);
      try {
        console.log(`useTradeValue: Searching for settings - game=${game}, baseValue=${baseValue}`);
        
        // Query for matching trade value settings
        // IMPORTANT FIX: We need to find settings where min_value <= baseValue <= max_value
        const { data: settings, error } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', game)
          .lte('min_value', baseValue)
          .gte('max_value', baseValue)
          .order('min_value', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error querying trade_value_settings:', error);
          throw error;
        }

        console.log(`Trade value lookup: game=${game}, baseValue=${baseValue}`, settings);

        if (settings?.[0]) {
          const setting = settings[0];
          console.log('Found matching setting:', setting);
          
          // Check if fixed values are provided
          if (setting.fixed_cash_value != null && setting.fixed_trade_value != null) {
            console.log('Using fixed values:', {
              fixedCashValue: setting.fixed_cash_value,
              fixedTradeValue: setting.fixed_trade_value
            });
            
            // Use fixed values directly
            setCashValue(setting.fixed_cash_value);
            setTradeValue(setting.fixed_trade_value);
          } else {
            // Calculate based on percentages
            const calculatedCashValue = baseValue * (setting.cash_percentage / 100);
            const calculatedTradeValue = baseValue * (setting.trade_percentage / 100);
            
            console.log(`Calculated values based on percentages:`, {
              cashPercentage: setting.cash_percentage,
              tradePercentage: setting.trade_percentage,
              baseValue: baseValue,
              cashValue: calculatedCashValue,
              tradeValue: calculatedTradeValue
            });
            
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
          }
        } else {
          // Default values if no setting found
          console.log('No matching settings found. Using default percentages (50% for cash, 65% for trade)');
          const defaultCashValue = baseValue * 0.5;
          const defaultTradeValue = baseValue * 0.65;
          setCashValue(defaultCashValue);
          setTradeValue(defaultTradeValue);
          
          console.log(`Using default values:`, {
            cashValue: defaultCashValue,
            tradeValue: defaultTradeValue
          });
        }
      } catch (error) {
        console.error('Error calculating trade values:', error);
        // Fallback to default values
        const defaultCashValue = baseValue * 0.5;
        const defaultTradeValue = baseValue * 0.65;
        setCashValue(defaultCashValue);
        setTradeValue(defaultTradeValue);
        
        console.log(`Error occurred, using fallback values:`, {
          cashValue: defaultCashValue,
          tradeValue: defaultTradeValue
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading };
}
