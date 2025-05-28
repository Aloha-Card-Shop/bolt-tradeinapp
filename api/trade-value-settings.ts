
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing Supabase key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for trade value settings
interface SettingsCache {
  [game: string]: {
    settings: any[];
    timestamp: number;
  }
}

const settingsCache: SettingsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGameSettings(game: string): Promise<any[]> {
  const normalizedGame = game.toLowerCase();
  const now = Date.now();
  
  console.log(`[CACHE] Checking cache for ${normalizedGame}`);
  
  // Check if we have valid cached settings
  if (
    settingsCache[normalizedGame] && 
    now - settingsCache[normalizedGame].timestamp < CACHE_TTL
  ) {
    console.log(`[CACHE] Using cached settings for ${normalizedGame}`);
    return settingsCache[normalizedGame].settings;
  }
  
  // Fetch from database
  console.log(`[CACHE] Fetching from database for ${normalizedGame}`);
  const { data: settings, error } = await supabase
    .from('trade_value_settings')
    .select('*')
    .eq('game', normalizedGame);
    
  if (error) {
    console.error('[DATABASE ERROR]:', error);
    throw error;
  }
  
  console.log(`[DATABASE] Retrieved ${settings?.length || 0} settings:`, settings);
  
  // Update cache
  settingsCache[normalizedGame] = {
    settings: settings || [],
    timestamp: now
  };
  
  return settings || [];
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  console.log(`[API] ${req.method} request to trade-value-settings`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const game = url.searchParams.get('game') || 'pokemon';
      
      console.log(`[API GET] Fetching settings for game: ${game}`);
      
      const settings = await getGameSettings(game);
      console.log(`[API GET] Returning ${settings?.length || 0} settings`);
      
      return new Response(
        JSON.stringify(settings),
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );
    } catch (error: any) {
      console.error('[API GET ERROR]:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch settings', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { settings, game } = body;
      
      if (!settings || !Array.isArray(settings)) {
        return new Response(
          JSON.stringify({ error: 'Invalid settings format' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`[API POST] Saving ${settings.length} settings for game: ${game}`);

      // Delete existing settings for this game
      const { error: deleteError } = await supabase
        .from('trade_value_settings')
        .delete()
        .eq('game', game.toLowerCase());

      if (deleteError) {
        console.error('[API POST DELETE ERROR]:', deleteError);
        throw deleteError;
      }

      // Insert new settings
      if (settings.length > 0) {
        const { error: insertError } = await supabase
          .from('trade_value_settings')
          .insert(settings.map(setting => ({
            ...setting,
            game: game.toLowerCase()
          })));

        if (insertError) {
          console.error('[API POST INSERT ERROR]:', insertError);
          throw insertError;
        }
      }

      // Clear cache
      const normalizedGame = game.toLowerCase();
      if (settingsCache[normalizedGame]) {
        delete settingsCache[normalizedGame];
        console.log(`[CACHE] Cleared cache for ${normalizedGame}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error: any) {
      console.error('[API POST ERROR]:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save settings', 
          details: error.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
