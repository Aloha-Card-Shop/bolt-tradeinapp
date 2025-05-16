
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
        
        // CRITICAL FIX: The query logic was correct but not working as expected
        // We're querying for settings where min_value ≤ baseValue ≤ max_value
        // Let's modify our approach to make it more explicit
        
        console.log(`Executing query with parameters: game=${game}, baseValue=${baseValue}`);
        
        // First approach: Try with BETWEEN which is more explicit
        const { data: settingsUsingBetween, error: betweenError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', game)
          .filter('min_value', 'lte', baseValue)
          .filter('max_value', 'gte', baseValue)
          .order('min_value', { ascending: false })
          .limit(1);
          
        if (betweenError) {
          console.error('Error with BETWEEN query:', betweenError);
        } else {
          console.log('BETWEEN query response:', settingsUsingBetween);
        }
        
        // If the first approach doesn't work, try a simpler query and filter in JS
        if (!settingsUsingBetween?.length) {
          console.log('BETWEEN query returned no results, trying alternate approach');
          
          const { data: allSettings, error } = await supabase
            .from('trade_value_settings')
            .select('*')
            .eq('game', game);
            
          if (error) {
            console.error('Error querying all settings:', error);
            throw error;
          }
          
          console.log('All trade value settings for game:', allSettings);
          
          // Filter settings in JavaScript where min_value ≤ baseValue ≤ max_value
          const matchingSettings = allSettings?.filter(setting => 
            baseValue >= setting.min_value && baseValue <= setting.max_value
          );
          
          console.log('Matching settings after JS filtering:', matchingSettings);
          
          // Sort by min_value descending and take the first one
          const settings = matchingSettings?.sort((a, b) => b.min_value - a.min_value) || [];
          
          processSettings(settings);
        } else {
          processSettings(settingsUsingBetween);
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
    
    const processSettings = (settings: any[]) => {
      if (settings?.length > 0) {
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
    };

    calculateValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading };
}
