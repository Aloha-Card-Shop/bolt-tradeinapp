
import { createClient } from '@supabase/supabase-js';
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

// In-memory cache for trade value settings
interface SettingsCache {
  [game: string]: {
    settings: any[];
    timestamp: number;
  }
}

const settingsCache: SettingsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to get settings from cache or database
async function getGameSettings(game: string): Promise<any[]> {
  const normalizedGame = game.toLowerCase();
  const now = Date.now();
  
  // Check if we have valid cached settings
  if (
    settingsCache[normalizedGame] && 
    now - settingsCache[normalizedGame].timestamp < CACHE_TTL
  ) {
    console.log(`[CACHE] Using cached settings for ${normalizedGame}, age: ${(now - settingsCache[normalizedGame].timestamp) / 1000}s`);
    return settingsCache[normalizedGame].settings;
  }
  
  // If not in cache or expired, fetch from database
  console.log(`[CACHE] Cache miss for ${normalizedGame}, fetching from database`);
  const { data: settings, error } = await supabase
    .from('trade_value_settings')
    .select('*')
    .eq('game', normalizedGame);
    
  if (error) {
    console.error('[ERROR] Failed to fetch settings:', error);
    throw error;
  }
  
  // Update cache
  settingsCache[normalizedGame] = {
    settings: settings || [],
    timestamp: now
  };
  
  console.log(`[CACHE] Updated cache for ${normalizedGame} with ${settings?.length || 0} settings`);
  return settings || [];
}

// Function to clear cache for a specific game
export function clearSettingsCache(game?: string): void {
  if (game) {
    const normalizedGame = game.toLowerCase();
    if (settingsCache[normalizedGame]) {
      delete settingsCache[normalizedGame];
      console.log(`[CACHE] Cleared cache for ${normalizedGame}`);
    }
  } else {
    // Clear entire cache
    Object.keys(settingsCache).forEach(key => {
      delete settingsCache[key];
    });
    console.log('[CACHE] Cleared entire settings cache');
  }
}

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
  return ['pokemon', 'japanese-pokemon', 'magic', 'yugioh', 'sports', 'other'].includes(normalized as GameType)
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
  fallbackReason: keyof typeof ERROR_MESSAGES
): CalculationResult {
  // Calculate fallback values
  const cashValue = parseFloat((baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100)).toFixed(2));
  const tradeValue = parseFloat((baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100)).toFixed(2));
  
  // Return structured response with the appropriate error message from constants
  return {
    cashValue,
    tradeValue,
    usedFallback: true,
    fallbackReason,
    error: ERROR_MESSAGES[fallbackReason] || errorMessage
  };
}

// Standard API handler
export default async function handler(req: Request): Promise<Response> {
  console.log(`[REQUEST] POST /api/calculate-value`);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('[ERROR] Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        cashValue: 0,
        tradeValue: 0,
        usedFallback: true,
        fallbackReason: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Extract and validate request body
    const reqBody = await req.json();
    const { game, baseValue, userId } = reqBody;
    console.log(`[INFO] Processing calculation for game: ${game}, value: ${baseValue}, user: ${userId || 'anonymous'}`);

    // Validate baseValue
    const numericBase = Number(baseValue);
    if (isNaN(numericBase) || numericBase < 0) {
      console.warn(`[ERROR] Invalid baseValue: ${baseValue}, parsed as: ${numericBase}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid baseValue',
          details: { received: baseValue, parsed: numericBase },
          cashValue: 0,
          tradeValue: 0,
          usedFallback: true,
          fallbackReason: 'INVALID_INPUT'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Skip calculation if baseValue is 0
    if (numericBase === 0) {
      console.log('[INFO] Base value is 0, skipping calculation');
      return new Response(
        JSON.stringify({ cashValue: 0, tradeValue: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize game type
    const gameKey = normalizeGameType(game);
    console.log(`[INFO] Normalized game type from "${game}" to "${gameKey}"`);
    
    let usedFallback = false;
    let fallbackReason = '';

    try {
      // Get settings from cache or database using the helper function
      const settings = await getGameSettings(gameKey);

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

      console.log(`[INFO] Calculation result for ${gameKey}, $${numericBase}: Cash=$${roundedCashValue}, Trade=$${roundedTradeValue}, Method=${calculationMethod}, Fallback=${usedFallback}`);

      // Return the calculated values along with fallback information
      return new Response(
        JSON.stringify({ 
          cashValue: roundedCashValue, 
          tradeValue: roundedTradeValue,
          usedFallback,
          fallbackReason
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError: any) {
      console.error('[ERROR] Database error while fetching settings:', dbError);
      
      // Clear potentially corrupt cache for this game
      clearSettingsCache(gameKey);
      
      // Use fallbacks if database query fails
      usedFallback = true;
      fallbackReason = 'DATABASE_ERROR';
      
      // Log the fallback event
      await logFallbackEvent(
        game, 
        numericBase, 
        `Database error: ${dbError.message || 'Unknown error'}`,
        userId
      );
      
      // Return fallback values with error details
      return new Response(
        JSON.stringify(createErrorResponse(numericBase, `Database error: ${dbError.message || 'Unknown error'}`, 'DATABASE_ERROR')),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (err: any) {
    console.error('[ERROR] Unhandled exception in calculate-value API:', err);
    
    // Get base value from request body, defaulting to 0 if not present
    let baseValue = 0;
    let game = 'unknown';
    let userId;
    
    try {
      const reqBody = await req.json();
      baseValue = Number(reqBody?.baseValue) || 0;
      game = reqBody?.game || 'unknown';
      userId = reqBody?.userId;
    } catch (parseError) {
      console.error('[ERROR] Could not parse request body:', parseError);
    }
    
    // Log catastrophic error
    try {
      await logFallbackEvent(
        game, 
        baseValue, 
        `Calculation error: ${err.message || 'Unknown error'}`,
        userId
      );
    } catch (logError) {
      console.error('[ERROR] Failed to log calculation error:', logError);
    }
    
    // Return fallback values with detailed error information
    return new Response(
      JSON.stringify(createErrorResponse(baseValue, err.message || 'Unknown calculation error', 'UNKNOWN_ERROR')),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
