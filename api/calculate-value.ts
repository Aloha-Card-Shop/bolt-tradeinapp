
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { GameType } from '../src/types/card';
import { 
  DEFAULT_FALLBACK_CASH_PERCENTAGE, 
  DEFAULT_FALLBACK_TRADE_PERCENTAGE 
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
    await supabase
      .from('calculation_fallback_logs')
      .insert({
        game,
        base_value: baseValue,
        reason,
        user_id: userId || null,
        created_at: new Date().toISOString()
      });
  } catch (err) {
    // Silent fail on logging - shouldn't impact user experience
    console.error('Failed to log fallback event:', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate request body
    const { game, baseValue, userId } = req.body;

    // Validate baseValue
    const numericBase = Number(baseValue);
    if (isNaN(numericBase) || numericBase < 0) {
      return res.status(400).json({ 
        error: 'Invalid baseValue',
        details: { received: baseValue, parsed: numericBase }
      });
    }

    // Skip calculation if baseValue is 0
    if (numericBase === 0) {
      return res.status(200).json({ cashValue: 0, tradeValue: 0 });
    }

    // Normalize game type
    const gameKey = normalizeGameType(game);
    let usedFallback = false;
    let fallbackReason = '';

    // Fetch all settings for this game
    const { data: settings, error } = await supabase
      .from('trade_value_settings')
      .select('*')
      .eq('game', gameKey);

    // Handle database query errors with fallbacks
    if (error) {
      console.error('Supabase query error:', error);
      usedFallback = true;
      fallbackReason = 'DATABASE_ERROR';
      
      // Log the fallback event
      await logFallbackEvent(game, numericBase, `Database error: ${error.message}`, userId);
      
      // Return fallback values
      return res.status(200).json({
        cashValue: parseFloat((numericBase * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100)).toFixed(2)),
        tradeValue: parseFloat((numericBase * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100)).toFixed(2)),
        usedFallback: true,
        fallbackReason: 'DATABASE_ERROR'
      });
    }

    // Default fallback values
    let cashValue = numericBase * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100);
    let tradeValue = numericBase * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100);

    if (settings && settings.length > 0) {
      // Check for fixed values first
      const fixedSetting = settings.find(
        s => s.fixed_cash_value !== null && s.fixed_trade_value !== null
      );
      
      if (fixedSetting) {
        cashValue = fixedSetting.fixed_cash_value!;
        tradeValue = fixedSetting.fixed_trade_value!;
      } else {
        // Find percentage-based range match
        const rangeSetting = settings.find(
          s => numericBase >= s.min_value && numericBase <= s.max_value
        );
        
        if (rangeSetting) {
          cashValue = numericBase * (rangeSetting.cash_percentage / 100);
          tradeValue = numericBase * (rangeSetting.trade_percentage / 100);
        } else {
          // No range found, use fallbacks
          usedFallback = true;
          fallbackReason = 'NO_PRICE_RANGE_MATCH';
          
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

    // Return the calculated values along with fallback information
    return res.status(200).json({ 
      cashValue: roundedCashValue, 
      tradeValue: roundedTradeValue,
      usedFallback,
      fallbackReason
    });
    
  } catch (err: any) {
    console.error('Error in calculate-value API:', err);
    
    // Log catastrophic error
    try {
      await logFallbackEvent(
        req.body?.game || 'unknown', 
        Number(req.body?.baseValue) || 0, 
        `Calculation error: ${err.message || 'Unknown error'}`,
        req.body?.userId
      );
    } catch (logError) {
      console.error('Failed to log calculation error:', logError);
    }
    
    // Return fallback values even in case of catastrophic errors
    return res.status(200).json({ 
      cashValue: parseFloat((Number(req.body?.baseValue || 0) * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100)).toFixed(2)), 
      tradeValue: parseFloat((Number(req.body?.baseValue || 0) * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100)).toFixed(2)),
      usedFallback: true,
      fallbackReason: 'CALCULATION_ERROR',
      error: 'Error calculating values, using defaults'
    });
  }
}
