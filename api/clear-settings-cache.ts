
import { clearSettingsCache } from './utils/settingsCache';

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const { game } = await req.json();
      
      console.log(`[CLEAR-CACHE API] Clearing cache for game: ${game || 'all'}`);
      
      clearSettingsCache(game);
      
      return new Response(
        JSON.stringify({ success: true, message: `Cache cleared for ${game || 'all games'}` }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error('[CLEAR-CACHE API] Error clearing cache:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to clear cache', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
