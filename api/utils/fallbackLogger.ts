
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

// Log fallback events for future review
export async function logFallbackEvent(
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
