
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { GameType } from '../src/types/card';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate request body
    const { game, baseValue } = req.body;

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

    // Fetch all settings for this game
    const { data: settings, error } = await supabase
      .from('trade_value_settings')
      .select('*')
      .eq('game', gameKey);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message
      });
    }

    // Default fallback values
    let cashValue = numericBase * 0.35;
    let tradeValue = numericBase * 0.50;

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
        }
      }
    }

    // Round to exactly two decimal places
    const roundedCashValue = parseFloat(cashValue.toFixed(2));
    const roundedTradeValue = parseFloat(tradeValue.toFixed(2));

    // Return the calculated values
    return res.status(200).json({ 
      cashValue: roundedCashValue, 
      tradeValue: roundedTradeValue 
    });
    
  } catch (err: any) {
    console.error('Error in calculate-value API:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message || 'Unknown error'
    });
  }
}
