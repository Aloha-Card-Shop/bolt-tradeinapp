
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { GameType } from '../src/types/card';
import { CalculationResult } from '../src/types/calculation';
import { 
  DEFAULT_FALLBACK_CASH_PERCENTAGE, 
  DEFAULT_FALLBACK_TRADE_PERCENTAGE,
  ERROR_MESSAGES
} from '../src/constants/fallbackValues';

// Initialize Supabase client
const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

// Helper function to normalize game type strings
const normalizeGameType = (gameType?: string): GameType => {
  if (!gameType) return 'pokemon';
  
  const normalized = gameType.toLowerCase().trim();
  
  if (['pokémon', 'pokemon'].includes(normalized)) return 'pokemon';
  if (['japanese-pokemon', 'japanese pokemon', 'pokemon (japanese)', 'pokemon japanese'].includes(normalized)) 
    return 'japanese-pokemon';
  if (['magic', 'magic: the gathering', 'mtg', 'magic the gathering'].includes(normalized)) 
    return 'magic';
  
  // fallback
  return ['pokemon', 'japanese-pokemon', 'magic'].includes(normalized as GameType)
    ? (normalized as GameType)
    : 'pokemon';
};

// Log fallback events for future review
async function logFallbackEvent(
  game: string, 
  baseValue: number, 
  reason: string,
  userId?: string
) {
  try {
    console.log(`[FALLBACK LOG] Game: ${game}, Value: ${baseValue}, Reason: ${reason}, User: ${userId || 'anonymous'}`);
    
    await supabase
      .from('calculation_fallback_logs')
      .insert({
        game,
        base_value: baseValue,
        reason,
        user_id: userId || null,
        created_at: new Date().toISOString()
      });
      
    console.log('[FALLBACK LOG] Successfully logged to database');
  } catch (err) {
    // Silent fail on logging - shouldn't impact user experience
    console.error('[ERROR] Failed to log fallback event:', err);
  }
}

// Create structured response with errors and fallback info
function createErrorResponse(
  baseValue: number,
  errorMessage: string, 
  fallbackReason: string,
  statusCode: number = 200 // Use 200 to allow frontend to handle gracefully
): CalculationResult {
  // Calculate fallback values
  const cashValue = parseFloat((baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100)).toFixed(2));
  const tradeValue = parseFloat((baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100)).toFixed(2));
  
  // Return structured response
  return {
    cashValue,
    tradeValue,
    usedFallback: true,
    fallbackReason,
    error: errorMessage
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[REQUEST] ${req.method} /api/calculate-value with body:`, req.body);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('[ERROR] Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      cashValue: 0,
      tradeValue: 0,
      usedFallback: true,
      fallbackReason: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // Extract and validate request body
    const { game, baseValue, userId } = req.body;
    console.log(`[INFO] Processing calculation for game: ${game}, value: ${baseValue}, user: ${userId || 'anonymous'}`);

    // Validate baseValue
    const numericBase = Number(baseValue);
    if (isNaN(numericBase) || numericBase < 0) {
      console.warn(`[ERROR] Invalid baseValue: ${baseValue}, parsed as: ${numericBase}`);
      
      return res.status(400).json({ 
        error: 'Invalid baseValue',
        details: { received: baseValue, parsed: numericBase },
        cashValue: 0,
        tradeValue: 0,
        usedFallback: true,
        fallbackReason: 'INVALID_INPUT'
      });
    }

    // Skip calculation if baseValue is 0
    if (numericBase === 0) {
      console.log('[INFO] Base value is 0, skipping calculation');
      return res.status(200).json({ cashValue: 0, tradeValue: 0 });
    }

    // Normalize game type
    const gameKey = normalizeGameType(game);
    console.log(`[INFO] Normalized game type from "${game}" to "${gameKey}"`);
    
    let usedFallback = false;
    let fallbackReason = '';

    // Fetch all settings for this game
    console.log(`[INFO] Querying trade_value_settings for game: ${gameKey}`);
    const { data: settings, error } = await supabase
      .from('trade_value_settings')
      .select('*')
      .eq('game', gameKey);

    // Handle database query errors with fallbacks
    if (error) {
      console.error('[ERROR] Supabase query error:', error);
      usedFallback = true;
      fallbackReason = 'DATABASE_ERROR';
      
      // Log the fallback event
      await logFallbackEvent(game, numericBase, `Database error: ${error.message}`, userId);
      
      // Return fallback values with error details
      return res.status(200).json(
        createErrorResponse(numericBase, `Database error: ${error.message}`, 'DATABASE_ERROR')
      );
    }

    // Default fallback values
    let cashValue = numericBase * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100);
    let tradeValue = numericBase * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100);
    let calculationMethod = 'default';

    if (settings && settings.length > 0) {
      console.log(`[INFO] Found ${settings.length} setting(s) for game: ${gameKey}`);
      
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
          s => numericBase >= s.min_value && numericBase <= s.max_value
        );
        
        if (rangeSetting) {
          console.log(`[INFO] Found matching range for value ${numericBase}: ${rangeSetting.min_value} to ${rangeSetting.max_value}`);
          cashValue = numericBase * (rangeSetting.cash_percentage / 100);
          tradeValue = numericBase * (rangeSetting.trade_percentage / 100);
          calculationMethod = 'percentage';
        } else {
          // No range found, use fallbacks
          usedFallback = true;
          fallbackReason = 'NO_PRICE_RANGE_MATCH';
          console.warn(`[WARN] No price range match found for game ${gameKey} and value ${numericBase}, using fallback values`);
          
          // Log the fallback event
          await logFallbackEvent(
            game, 
            numericBase, 
            `No price range match found for game ${gameKey} and value ${numericBase}`,
            userId
          );
        }
      }
    } else {
      // No settings found for this game, using defaults
      usedFallback = true;
      fallbackReason = 'NO_SETTINGS_FOUND';
      console.warn(`[WARN] No settings found for game ${gameKey}, using fallback values`);
      
      // Log the fallback event
      await logFallbackEvent(
        game, 
        numericBase, 
        `No settings found for game ${gameKey}`,
        userId
      );
    }

    // Round to exactly two decimal places
    const roundedCashValue = parseFloat(cashValue.toFixed(2));
    const roundedTradeValue = parseFloat(tradeValue.toFixed(2));

    // Log the calculation result
    console.log(`[INFO] Calculation result for ${gameKey}, $${numericBase}: Cash=$${roundedCashValue}, Trade=$${roundedTradeValue}, Method=${calculationMethod}, Fallback=${usedFallback}`);

    // Return the calculated values along with fallback information
    return res.status(200).json({ 
      cashValue: roundedCashValue, 
      tradeValue: roundedTradeValue,
      usedFallback,
      fallbackReason
    });
    
  } catch (err: any) {
    console.error('[ERROR] Unhandled exception in calculate-value API:', err);
    
    // Get base value from request body, defaulting to 0 if not present
    const baseValue = Number(req.body?.baseValue) || 0;
    const game = req.body?.game || 'unknown';
    
    // Log catastrophic error
    try {
      await logFallbackEvent(
        game, 
        baseValue, 
        `Calculation error: ${err.message || 'Unknown error'}`,
        req.body?.userId
      );
    } catch (logError) {
      console.error('[ERROR] Failed to log calculation error:', logError);
    }
    
    // Return fallback values with detailed error information
    return res.status(200).json(
      createErrorResponse(baseValue, err.message || 'Unknown calculation error', 'CALCULATION_ERROR')
    );
  }
}
