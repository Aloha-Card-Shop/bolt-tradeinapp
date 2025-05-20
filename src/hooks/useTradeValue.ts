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
  console.log(`normalizeGameType called with input: "${gameType}"`);
  
  if (!gameType) {
    console.warn('useTradeValue: Received undefined or empty game type');
    return undefined;
  }
  
  // Convert to lowercase for consistent comparison
  const normalizedGame = gameType.toLowerCase().trim();
  
  // Check if it matches one of our valid game types
  const validGameTypes: GameType[] = ['pokemon', 'japanese-pokemon', 'magic'];
  
  // Handle specific common cases
  if (normalizedGame === 'pokémon' || normalizedGame === 'pokemon') {
    console.log('useTradeValue: Normalized "pokémon"/"pokemon" to "pokemon"');
    return 'pokemon';
  } 
  
  if (normalizedGame === 'japanese-pokemon' || normalizedGame === 'japanese pokemon' || 
      normalizedGame === 'pokemon (japanese)' || normalizedGame === 'pokemon japanese') {
    console.log('useTradeValue: Normalized to "japanese-pokemon"');
    return 'japanese-pokemon';
  }
  
  if (normalizedGame === 'magic' || normalizedGame === 'magic: the gathering' || 
      normalizedGame === 'mtg' || normalizedGame === 'magic the gathering') {
    console.log('useTradeValue: Normalized to "magic"');
    return 'magic';
  }
  
  // Debug log to help identify any issues with game type
  console.log(`useTradeValue: Normalizing game type "${gameType}" to "${normalizedGame}"`);
  
  if (validGameTypes.includes(normalizedGame as GameType)) {
    return normalizedGame as GameType;
  }
  
  console.warn(`Invalid game type: "${gameType}". Valid types are: ${validGameTypes.join(', ')}. Using pokemon as fallback.`);
  return 'pokemon'; // Default to pokemon as fallback to ensure we have a value
};

export function useTradeValue(game?: GameType, baseValue?: number): TradeValueHookReturn {
  const [cashValue, setCashValue] = useState(0);
  const [tradeValue, setTradeValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Add unique request ID to track calls consistently
  const requestId = Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    // Reset error state on new calculation
    setError(undefined);
    
    // Enhanced logging for input tracking
    console.log(`useTradeValue [${requestId}]: Effect triggered with game=${game}, baseValue=${baseValue}`);
    
    // Validate and normalize game type
    const normalizedGameType = normalizeGameType(game);
    
    // Debug logs for input parameters
    console.log(`useTradeValue [${requestId}]: Processing with parameters:`, { 
      originalGameType: game,
      normalizedGameType,
      baseValue,
      requestId
    });
    
    // Validate input parameters
    if (!normalizedGameType) {
      console.error(`useTradeValue [${requestId}]: Invalid game type: "${game}", using default "pokemon"`);
      setError(`Invalid game type: "${game}", using default "pokemon"`);
      // Continue with default pokemon
    }
    
    // Validate baseValue before proceeding
    if (!baseValue || baseValue <= 0) {
      console.log(`useTradeValue [${requestId}]: Invalid baseValue - game=${normalizedGameType}, baseValue=${baseValue}`);
      setCashValue(0);
      setTradeValue(0);
      setIsLoading(false); // Ensure we're not showing loading state
      return;
    }

    const calculateValues = async () => {
      console.log(`useTradeValue [${requestId}]: Starting calculation with baseValue=${baseValue}, game=${normalizedGameType}`);
      setIsLoading(true);
      
      try {
        // Convert baseValue to a number if it's not already to ensure proper comparison
        const numericBaseValue = Number(baseValue);
        console.log(`useTradeValue [${requestId}]: Using numeric baseValue=${numericBaseValue}`);
        
        if (isNaN(numericBaseValue) || numericBaseValue <= 0) {
          throw new Error(`Invalid baseValue: ${baseValue}, converted to ${numericBaseValue}`);
        }
        
        const gameTypeForQuery = normalizedGameType || 'pokemon'; // Default to pokemon if undefined
        
        console.log(`useTradeValue [${requestId}]: Querying trade value settings for game=${gameTypeForQuery}, value=${numericBaseValue}`);
        
        // First try to find matching settings using fixed value options
        const { data: fixedSettings, error: fixedQueryError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', gameTypeForQuery)
          .not('fixed_cash_value', 'is', null)
          .not('fixed_trade_value', 'is', null);
            
        if (fixedQueryError) {
          console.error(`useTradeValue [${requestId}]: Error querying fixed trade value settings:`, fixedQueryError);
          throw fixedQueryError;
        }
        
        console.log(`useTradeValue [${requestId}]: Fixed trade value settings query result:`, fixedSettings);
        
        // If we have fixed values, use those
        if (fixedSettings && fixedSettings.length > 0) {
          console.log(`useTradeValue [${requestId}]: Using fixed trade values:`, fixedSettings[0]);
          
          // Use null-coalescing to handle null values safely
          const fixedCashValue = fixedSettings[0].fixed_cash_value ?? (numericBaseValue * 0.5);
          const fixedTradeValue = fixedSettings[0].fixed_trade_value ?? (numericBaseValue * 0.65);
          
          console.log(`useTradeValue [${requestId}]: Setting fixedCashValue=${fixedCashValue}, fixedTradeValue=${fixedTradeValue}`);
          setCashValue(fixedCashValue);
          setTradeValue(fixedTradeValue);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, query for settings where min_value ≤ baseValue ≤ max_value
        console.log(`useTradeValue [${requestId}]: No fixed settings found, querying range-based settings`);
        
        const { data: settings, error: queryError } = await supabase
          .from('trade_value_settings')
          .select('*')
          .eq('game', gameTypeForQuery)
          .lte('min_value', numericBaseValue)
          .gte('max_value', numericBaseValue);
          
        if (queryError) {
          console.error(`useTradeValue [${requestId}]: Error querying trade value settings:`, queryError);
          throw queryError;
        }
        
        console.log(`useTradeValue [${requestId}]: Range-based settings query result:`, settings);
        
        if (!settings || settings.length === 0) {
          console.warn(`useTradeValue [${requestId}]: No trade value settings found for game=${gameTypeForQuery} and value=${numericBaseValue}, trying lenient query`);
          
          // Try a more lenient query
          const { data: lenientSettings, error: lenientQueryError } = await supabase
            .from('trade_value_settings')
            .select('*')
            .eq('game', gameTypeForQuery)
            .order('min_value', { ascending: false });
            
          if (lenientQueryError) {
            console.error(`useTradeValue [${requestId}]: Error querying lenient trade value settings:`, lenientQueryError);
            throw lenientQueryError;
          }
          
          console.log(`useTradeValue [${requestId}]: Lenient trade value settings query result:`, lenientSettings);
          
          if (lenientSettings && lenientSettings.length > 0) {
            // Find the closest range
            const applicableSetting = lenientSettings.find(s => numericBaseValue >= s.min_value) || 
                                     lenientSettings[lenientSettings.length - 1]; // Fallback to lowest range
                                     
            console.log(`useTradeValue [${requestId}]: Found applicable setting with lenient query:`, applicableSetting);
            
            // Calculate based on percentages
            const calculatedCashValue = numericBaseValue * (applicableSetting.cash_percentage / 100);
            const calculatedTradeValue = numericBaseValue * (applicableSetting.trade_percentage / 100);
            
            console.log(`useTradeValue [${requestId}]: Calculated values:`, {
              baseValue: numericBaseValue,
              cashValue: calculatedCashValue,
              cashPercent: applicableSetting.cash_percentage,
              tradeValue: calculatedTradeValue,
              tradePercent: applicableSetting.trade_percentage
            });
            
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
            setError(`Using approximate percentage from range ${applicableSetting.min_value}-${applicableSetting.max_value}.`);
            setIsLoading(false);
          } else {
            // Fallback to default percentages
            const defaultCashPercentage = 50;
            const defaultTradePercentage = 65;
            const defaultCashValue = numericBaseValue * (defaultCashPercentage / 100);
            const defaultTradeValue = numericBaseValue * (defaultTradePercentage / 100);
            
            console.log(`useTradeValue [${requestId}]: No settings found, using default percentages:`, {
              baseValue: numericBaseValue,
              cashPercentage: defaultCashPercentage,
              tradePercentage: defaultTradePercentage,
              cashValue: defaultCashValue,
              tradeValue: defaultTradeValue
            });
            
            setCashValue(defaultCashValue);
            setTradeValue(defaultTradeValue);
            setError(`No price range found for ${gameTypeForQuery} cards valued at $${numericBaseValue.toFixed(2)}. Using default percentages.`);
            setIsLoading(false);
          }
        } else {
          const setting = settings[0];
          console.log(`useTradeValue [${requestId}]: Found matching setting:`, setting);
          
          // Check if fixed values are provided
          if (setting.fixed_cash_value != null && setting.fixed_trade_value != null) {
            console.log(`useTradeValue [${requestId}]: Using fixed values:`, {
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
            
            console.log(`useTradeValue [${requestId}]: Calculated values based on percentages:`, {
              cashPercentage: setting.cash_percentage,
              tradePercentage: setting.trade_percentage,
              baseValue: numericBaseValue,
              cashValue: calculatedCashValue,
              tradeValue: calculatedTradeValue
            });
            
            setCashValue(calculatedCashValue);
            setTradeValue(calculatedTradeValue);
          }
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error(`useTradeValue [${requestId}]: Error calculating trade values:`, error);
        
        // Fallback to default values with error notification
        const defaultCashValue = Number(baseValue) * 0.5;
        const defaultTradeValue = Number(baseValue) * 0.65;
        setCashValue(defaultCashValue);
        setTradeValue(defaultTradeValue);
        
        console.log(`useTradeValue [${requestId}]: Error occurred, using fallback values:`, {
          cashValue: defaultCashValue,
          tradeValue: defaultTradeValue
        });
        
        setError(`Error calculating values: ${error.message || 'Unknown error'}`);
        toast.error(`Failed to calculate trade values: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    calculateValues();
  }, [game, baseValue, requestId]);

  // Add a final logging to see what values we're actually returning
  console.log(`useTradeValue [${requestId}]: Returning values:`, {
    cashValue,
    tradeValue,
    isLoading,
    error,
    baseValue,
    game
  });

  return { cashValue, tradeValue, isLoading, error };
}
