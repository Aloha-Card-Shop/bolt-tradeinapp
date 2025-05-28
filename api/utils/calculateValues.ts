
import { createClient } from '@supabase/supabase-js';
import { logFallbackEvent } from './fallbackLogger';
import { createErrorResponse } from './errorResponse';
import { DEFAULT_FALLBACK_CASH_PERCENTAGE, DEFAULT_FALLBACK_TRADE_PERCENTAGE } from '../../src/constants/fallbackValues';

const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing Supabase key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CalculationOptions {
  game: string;
  baseValue: number;
  userId?: string;
}

export interface CalculationResult {
  cashValue: number;
  tradeValue: number;
  usedFallback: boolean;
  fallbackReason?: string;
  error?: string;
}

interface TradeValueSetting {
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

async function getGameSettings(game: string): Promise<TradeValueSetting[]> {
  const { data: settings, error } = await supabase
    .from('trade_value_settings')
    .select('*')
    .eq('game', game.toLowerCase());
    
  if (error) {
    console.error('[DATABASE ERROR]:', error);
    throw error;
  }
  
  return settings || [];
}

// Core calculation logic
export async function calculateValues({
  game,
  baseValue,
  userId
}: CalculationOptions): Promise<CalculationResult> {
  if (baseValue === 0) {
    return { cashValue: 0, tradeValue: 0, usedFallback: false };
  }

  try {
    // Get settings from database
    const settings = await getGameSettings(game);

    // Default fallback values
    let cashValue = baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100);
    let tradeValue = baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100);
    let calculationMethod = 'default';
    let usedFallback = false;
    let fallbackReason = '';

    if (settings && settings.length > 0) {
      console.log(`[INFO] Found ${settings.length} setting(s) for game: ${game}`);
      
      // Check for fixed values first
      const fixedSetting = settings.find(
        (s: TradeValueSetting) => s.fixed_cash_value !== null && s.fixed_trade_value !== null
      );
      
      if (fixedSetting) {
        console.log('[INFO] Using fixed values from settings');
        cashValue = fixedSetting.fixed_cash_value!;
        tradeValue = fixedSetting.fixed_trade_value!;
        calculationMethod = 'fixed';
      } else {
        // Find percentage-based range match
        const rangeSetting = settings.find(
          (s: TradeValueSetting) => baseValue >= s.min_value && baseValue <= s.max_value
        );
        
        if (rangeSetting) {
          console.log(`[INFO] Found matching range for value ${baseValue}: ${rangeSetting.min_value} to ${rangeSetting.max_value}`);
          cashValue = baseValue * (rangeSetting.cash_percentage / 100);
          tradeValue = baseValue * (rangeSetting.trade_percentage / 100);
          calculationMethod = 'percentage';
        } else {
          // No range found, use fallbacks
          usedFallback = true;
          fallbackReason = 'NO_PRICE_RANGE_MATCH';
          console.warn(`[WARN] No price range match found for game ${game} and value ${baseValue}, using fallback values`);
          
          // Log the fallback event
          await logFallbackEvent(
            game, 
            baseValue, 
            `No price range match found for game ${game} and value ${baseValue}`,
            userId
          );
        }
      }
    } else {
      // No settings found for this game, using defaults
      usedFallback = true;
      fallbackReason = 'NO_SETTINGS_FOUND';
      console.warn(`[WARN] No settings found for game ${game}, using fallback values`);
      
      // Log the fallback event
      await logFallbackEvent(
        game, 
        baseValue, 
        `No settings found for game ${game}`,
        userId
      );
    }

    // Round to exactly two decimal places
    const roundedCashValue = parseFloat(cashValue.toFixed(2));
    const roundedTradeValue = parseFloat(tradeValue.toFixed(2));

    console.log(`[INFO] Calculation result for ${game}, $${baseValue}: Cash=$${roundedCashValue}, Trade=$${roundedTradeValue}, Method=${calculationMethod}, Fallback=${usedFallback}`);

    return {
      cashValue: roundedCashValue,
      tradeValue: roundedTradeValue,
      usedFallback,
      fallbackReason
    };
  } catch (error: any) {
    console.error('[ERROR] Error in calculation logic:', error);
    return createErrorResponse(baseValue, `Calculation error: ${error.message}`, 'DATABASE_ERROR');
  }
}
