
import { getGameSettings } from './settingsCache';
import { logFallbackEvent } from './fallbackLogger';
import { createErrorResponse } from './errorResponse';
import { DEFAULT_FALLBACK_CASH_PERCENTAGE, DEFAULT_FALLBACK_TRADE_PERCENTAGE } from '../../src/constants/fallbackValues';

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
    // Get settings from cache or database using the helper function
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
        s => s.fixed_cash_value !== null && s.fixed_trade_value !== null
      );
      
      if (fixedSetting) {
        console.log('[INFO] Using fixed values from settings');
        cashValue = fixedSetting.fixed_cash_value!;
        tradeValue = fixedSetting.fixed_trade_value!;
        calculationMethod = 'fixed';
      } else {
        // Find percentage-based range match
        const rangeSetting = settings.find(
          s => baseValue >= s.min_value && baseValue <= s.max_value
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
