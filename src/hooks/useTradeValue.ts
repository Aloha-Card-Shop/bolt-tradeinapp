
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
  if (!gameType) {
    console.warn('useTradeValue: Received undefined or empty game type');
    return undefined;
  }
  
  // Convert to lowercase for consistent comparison
  const normalizedGame = gameType.toLowerCase().trim();
  
  // Check if it matches one of our valid game types
  const validGameTypes: GameType[] = ['pokemon', 'japanese-pokemon', 'magic'];
  
  // Debug log to help identify any issues with game type
  console.log(`useTradeValue: Normalizing game type "${gameType}" to "${normalizedGame}"`);
  
  if (validGameTypes.includes(normalizedGame as GameType)) {
    return normalizedGame as GameType;
  }
  
  console.warn(`Invalid game type: "${gameType}". Valid types are: ${validGameTypes.join(', ')}`);
  return undefined;
};

export function useTradeValue(game?: GameType, baseValue?: number): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // Reset error state on new calculation
    setError(undefined);
    
    // Validate and normalize game type
    const normalizedGameType = normalizeGameType(game);
    
    // Debug logs for input parameters
    console.log('useTradeValue: Input parameters', { 
      originalGameType: game,
      normalizedGameType,
      baseValue: baseValue
    });
    
    // Validate input parameters
    if (!normalizedGameType) {
      console.error(`useTradeValue: Invalid game type: "${game}"`);
      setError(`Invalid game type: "${game}"`);
      setCashValue(0);
      setTradeValue(0);
      return;
    }
    
    if (!baseValue || baseValue <= 0) {
      console.log(`useTradeValue: Invalid baseValue - game=${normalizedGameType}, baseValue=${baseValue}`);
      setCashValue(0);
      setTradeValue(0);
      return;
    }

    const calculateValues = async () => {
      setIsLoading(true);
      try {
        console.log(`useTradeValue: Calculating values with parameters - game=${normalizedGameType}, baseValue=${baseValue}`);
        
        // Convert baseValue to a number if it's not already to ensure proper comparison
        const numericBaseValue = Number(baseValue);
        
        console.log(`Querying trade value settings for game=${normalizedGameType}, value=${numericBaseValue}`);
        
        // First try to find matching settings using fixed value options
        const { data: fixedSettings, error: fixedQueryError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', normalizedGameType)
          .not('fixed_cash_value', 'is', null)
          .not('fixed_trade_value', 'is', null);
            
        if (fixedQueryError) {
          console.error('Error querying fixed trade value settings:', fixedQueryError);
          throw fixedQueryError;
        }
        
        console.log('Fixed trade value settings query result:', fixedSettings);
        
        // If we have fixed values, use those
        if (fixedSettings && fixedSettings.length > 0) {
          console.log('Using fixed trade values:', fixedSettings[0]);
          setCashValue(fixedSettings[0].fixed_cash_value);
          setTradeValue(fixedSettings[0].fixed_trade_value);
          return;
        }
        
        // Otherwise, query for settings where min_value ≤ baseValue ≤ max_value
        const { data: settings, error: queryError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', normalizedGameType)
          .lte('min_value', numericBaseValue)
          .gte('max_value', numericBaseValue);
          
        if (queryError) {
          console.error('Error querying trade value settings:', queryError);
          throw queryError;
        }
        
        console.log('Trade value settings query result:', settings);
        
        if (!settings || settings.length === 0) {
          console.warn(`No trade value settings found for game=${normalizedGameType} and value=${numericBaseValue}`);
          
          // Try a more lenient query
          const { data: lenientSettings, error: lenientQueryError } = await supabase
            .from('trade_value_settings')
            .select('*')
            .eq('game', normalizedGameType)
            .order('min_value', { ascending: false });
            
          if (lenientQueryError) {
            console.error('Error querying lenient trade value settings:', lenientQueryError);
            throw lenientQueryError;
          }
          
          console.log('Lenient trade value settings query result:', lenientSettings);
          
          if (lenientSettings && lenientSettings.length > 0) {
            // Find the closest range
            const applicableSetting = lenientSettings.find(s => numericBaseValue >= s.min_value) || 
                                     lenientSettings[lenientSettings.length - 1]; // Fallback to lowest range
                                     
            console.log('Found applicable setting with lenient query:', applicableSetting);
            
            // Calculate based on percentages
            const calculatedCashValue = numericBaseValue * (applicableSetting.cash_percentage / 100);
            const calculatedTradeValue = numericBaseValue * (applicableSetting.trade_percentage / 100);
            
            console.log('Calculated values:', {
              cashValue: calculatedCashValue,
              cashPercent: applicableSetting.cash_percentage,
              tradeValue: calculatedTradeValue,
              tradePercent: applicableSetting.trade_percentage,
              baseValue: numericBaseValue
            });
            
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
            setError(`Using approximate percentage from range ${applicableSetting.min_value}-${applicableSetting.max_value}.`);
          } else {
            // Fallback to default percentages
            const defaultCashValue = numericBaseValue * 0.5;
            const defaultTradeValue = numericBaseValue * 0.65;
            
            console.log(`Using default percentages: cash=50%, trade=65%, resulting in:`, {
              cashValue: defaultCashValue,
              tradeValue: defaultTradeValue
            });
            
            setCashValue(defaultCashValue);
            setTradeValue(defaultTradeValue);
            setError(`No price range found for ${normalizedGameType} cards valued at $${numericBaseValue.toFixed(2)}. Using default percentages.`);
          }
        } else {
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
            const calculatedCashValue = numericBaseValue * (setting.cash_percentage / 100);
            const calculatedTradeValue = numericBaseValue * (setting.trade_percentage / 100);
            
            console.log(`Calculated values based on percentages:`, {
              cashPercentage: setting.cash_percentage,
              tradePercentage: setting.trade_percentage,
              baseValue: numericBaseValue,
              cashValue: calculatedCashValue,
              tradeValue: calculatedTradeValue
            });
            
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
          }
        }
      } catch (error: any) {
        console.error('Error calculating trade values:', error);
        
        // Fallback to default values with error notification
        const defaultCashValue = Number(baseValue) * 0.5;
        const defaultTradeValue = Number(baseValue) * 0.65;
        setCashValue(defaultCashValue);
        setTradeValue(defaultTradeValue);
        
        console.log(`Error occurred, using fallback values:`, {
          cashValue: defaultCashValue,
          tradeValue: defaultTradeValue
        });
        
        setError(`Error calculating values: ${error.message || 'Unknown error'}`);
        toast.error(`Failed to calculate trade values: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue]);

  return { cashValue, tradeValue, isLoading, error };
}
