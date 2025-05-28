
import { createClient } from '@supabase/supabase-js';

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
export async function getGameSettings(game: string): Promise<any[]> {
  const normalizedGame = game.toLowerCase();
  const now = Date.now();
  
  console.log(`[CACHE] Checking cache for ${normalizedGame}, current cache keys:`, Object.keys(settingsCache));
  
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
    console.error('[CACHE ERROR] Failed to fetch settings:', error);
    throw error;
  }
  
  console.log(`[CACHE] Database query result for ${normalizedGame}:`, settings);
  
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
