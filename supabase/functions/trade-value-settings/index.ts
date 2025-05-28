
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface TradeValueSetting {
  id?: string;
  game: string;
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      const game = url.searchParams.get('game') || 'pokemon';
      console.log(`[EDGE FUNCTION] Fetching settings for game: ${game}`);
      
      const { data: settings, error } = await supabase
        .from('trade_value_settings')
        .select('*')
        .eq('game', game.toLowerCase());
        
      if (error) {
        console.error('[EDGE FUNCTION] Database error:', error);
        throw error;
      }
      
      console.log(`[EDGE FUNCTION] Retrieved ${settings?.length || 0} settings`);
      
      return new Response(
        JSON.stringify(settings || []),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { settings, game } = body;
      
      if (!settings || !Array.isArray(settings)) {
        return new Response(
          JSON.stringify({ error: 'Invalid settings format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`[EDGE FUNCTION] Saving ${settings.length} settings for game: ${game}`);

      // Delete existing settings for this game
      const { error: deleteError } = await supabase
        .from('trade_value_settings')
        .delete()
        .eq('game', game.toLowerCase());

      if (deleteError) {
        console.error('[EDGE FUNCTION] Delete error:', deleteError);
        throw deleteError;
      }

      // Insert new settings if any
      if (settings.length > 0) {
        const { error: insertError } = await supabase
          .from('trade_value_settings')
          .insert(settings.map((setting: TradeValueSetting) => ({
            ...setting,
            game: game.toLowerCase()
          })));

        if (insertError) {
          console.error('[EDGE FUNCTION] Insert error:', insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[EDGE FUNCTION] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
