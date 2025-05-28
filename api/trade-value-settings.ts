
import { getGameSettings } from './utils/settingsCache';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

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

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const game = url.searchParams.get('game') || 'pokemon';
      
      console.log(`[API] Fetching settings for game: ${game}`);
      
      const settings = await getGameSettings(game);
      console.log(`[API] Retrieved ${settings?.length || 0} settings for ${game}:`, settings);
      
      // Ensure we return an array even if no settings found
      const responseData = Array.isArray(settings) ? settings : [];
      
      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error('[API] Error fetching settings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch settings', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  if (req.method === 'POST') {
    try {
      const { settings, game } = await req.json();
      
      if (!settings || !Array.isArray(settings)) {
        console.error('[API] Invalid settings format received:', { settings, game });
        return new Response(
          JSON.stringify({ error: 'Invalid settings format' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`[API] Saving ${settings.length} settings for game: ${game}`, settings);

      // Delete existing settings for this game
      const { error: deleteError } = await supabase
        .from('trade_value_settings')
        .delete()
        .eq('game', game.toLowerCase());

      if (deleteError) {
        console.error('[API] Error deleting existing settings:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete existing settings', details: deleteError.message }),
          { status: 500, headers: corsHeaders }
        );
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
          console.error('[API] Error inserting new settings:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save settings', details: insertError.message }),
            { status: 500, headers: corsHeaders }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error('[API] Error saving settings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save settings', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
