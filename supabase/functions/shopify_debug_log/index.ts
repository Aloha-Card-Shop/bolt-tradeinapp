
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
    
    // Log connection details (sanitized)
    console.log("Debug log function environment:", {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length || 0,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or service role key");
    }
    
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
    
    // Log to standard console first
    const logPrefix = `[${level.toUpperCase()}][${component}]`;
    if (level === 'error') {
      console.error(`${logPrefix} ${message}`, details);
    } else {
      console.log(`${logPrefix} ${message}`, details);
    }
    
    // Check if the table exists before inserting
    try {
      const { data: tableCheck, error: tableError } = await adminSupabase
        .from("shopify_debug_logs")
        .select("id")
        .limit(1);
      
      if (tableError) {
        console.error("Error checking shopify_debug_logs table:", tableError);
        throw new Error(`Table check error: ${tableError.message}`);
      }
    } catch (tableCheckError) {
      console.error("Exception checking table:", tableCheckError);
      throw new Error(`Table existence check failed: ${tableCheckError.message}`);
    }
    
    // Log detailed information to the debug_logs table
    try {
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
        console.error("Database error saving debug log:", error);
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (insertError) {
      console.error("Exception during log insert:", insertError);
      throw new Error(`Insert exception: ${insertError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error in debug log function:", errorMessage, err);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
