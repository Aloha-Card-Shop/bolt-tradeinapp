
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
  
  console.log(`[API CACHE] Checking cache for ${normalizedGame}`);
  
  // Check if we have valid cached settings
  if (
    settingsCache[normalizedGame] && 
    now - settingsCache[normalizedGame].timestamp < CACHE_TTL
  ) {
    console.log(`[API CACHE] Using cached settings for ${normalizedGame}`);
    return settingsCache[normalizedGame].settings;
  }
  
  // Fetch from database
  console.log(`[API CACHE] Fetching from database for ${normalizedGame}`);
  const { data: settings, error } = await supabase
    .from('trade_value_settings')
    .select('*')
    .eq('game', normalizedGame);
    
  if (error) {
    console.error('[API DATABASE ERROR]:', error);
    throw error;
  }
  
  console.log(`[API DATABASE] Retrieved ${settings?.length || 0} settings:`, settings);
  
  // Update cache
  settingsCache[normalizedGame] = {
    settings: settings || [],
    timestamp: now
  };
  
  return settings || [];
}

// Named export for GET requests
export async function GET(request: Request) {
  console.log(`[API HANDLER] Starting GET request processing - URL: ${request.url}`);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const url = new URL(request.url);
    const game = url.searchParams.get('game') || 'pokemon';
    
    console.log(`[API GET] Fetching settings for game: ${game}`);
    
    const settings = await getGameSettings(game);
    console.log(`[API GET] Returning ${settings?.length || 0} settings`);
    
    const response = new Response(
      JSON.stringify(settings),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
    
    console.log('[API GET] Response created successfully');
    return response;
  } catch (error: any) {
    console.error('[API GET ERROR]:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Named export for POST requests
export async function POST(request: Request) {
  console.log('[API HANDLER] Processing POST request');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { settings, game } = body;
    
    if (!settings || !Array.isArray(settings)) {
      console.error('[API POST] Invalid settings format:', { settings, game });
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
      console.log(`[API CACHE] Cleared cache for ${normalizedGame}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API POST ERROR]:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Named export for OPTIONS requests (CORS)
export async function OPTIONS() {
  console.log('[API HANDLER] Handling CORS preflight request');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  return new Response(null, { headers: corsHeaders });
}
