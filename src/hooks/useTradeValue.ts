
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
  
  // Convert to lowercase for consistent comparison
  const normalizedGame = gameType.toLowerCase().trim();
  
  // Check if it matches one of our valid game types
  const validGameTypes: GameType[] = ['pokemon', 'japanese-pokemon', 'magic'];
  
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
        
        // Query for settings where min_value ≤ baseValue ≤ max_value
        const { data: settings, error: queryError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', normalizedGameType)
          .filter('min_value', 'lte', baseValue)
          .filter('max_value', 'gte', baseValue)
          .order('min_value', { ascending: false })
          .limit(1);
          
        if (queryError) {
          console.error('Error querying trade value settings:', queryError);
          throw queryError;
        }
        
        console.log('Trade value settings query result:', {
          query: {
            game: normalizedGameType,
            min_value_lte: baseValue,
            max_value_gte: baseValue
          },
          results: settings,
          count: settings?.length || 0
        });
        
        if (!settings || settings.length === 0) {
          console.warn(`No trade value settings found for game=${normalizedGameType} and value=${baseValue}`);
          
          // Fallback to default percentages
          const defaultCashValue = baseValue * 0.5;
          const defaultTradeValue = baseValue * 0.65;
          
          console.log(`Using default percentages: cash=50%, trade=65%, resulting in:`, {
            cashValue: defaultCashValue,
            tradeValue: defaultTradeValue
          });
          
          setCashValue(defaultCashValue);
          setTradeValue(defaultTradeValue);
          setError(`No trade value settings found. Using default percentages.`);
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
        }
      } catch (error: any) {
        console.error('Error calculating trade values:', error);
        
        // Fallback to default values with error notification
        const defaultCashValue = baseValue * 0.5;
        const defaultTradeValue = baseValue * 0.65;
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
