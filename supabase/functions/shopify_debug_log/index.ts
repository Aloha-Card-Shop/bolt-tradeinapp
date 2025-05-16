
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request JSON body
    const requestData = await req.json();
    const { 
      trade_in_id, 
      item_id = null,
      level = 'info',
      component = 'shopify-sync',
      message, 
      details = {}
    } = requestData;
    
    if (!trade_in_id || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: trade_in_id and message are required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Log detailed information to a new debug_logs table
    const { data, error } = await adminSupabase
      .from("shopify_debug_logs")
      .insert({
        trade_in_id,
        item_id,
        level,
        component,
        message,
        details,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error saving debug log:", error);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to save debug log: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Also log to standard Deno console for edge function logs
    const logPrefix = `[${level.toUpperCase()}][${component}]`;
    if (level === 'error') {
      console.error(`${logPrefix} ${message}`, details);
    } else {
      console.log(`${logPrefix} ${message}`, details);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in debug log function:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
