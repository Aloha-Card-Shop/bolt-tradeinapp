
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
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const adminSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log("Fetching Shopify settings from database...");
    
    // Get Shopify settings
    const { data: settings, error: settingsError } = await adminSupabase
      .from("shopify_settings")
      .select("shop_domain, access_token")
      .limit(1)
      .single();
    
    if (settingsError) {
      console.error("Error fetching Shopify settings:", settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch Shopify settings: ${settingsError.message}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!settings) {
      console.error("No Shopify settings found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No Shopify settings found. Please configure your Shopify settings first." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Testing connection to Shopify shop: ${settings.shop_domain}`);
    
    // Use the Shopify Admin API to fetch shop information as a simple test
    // This is a very lightweight call that should work for any valid shop + token
    const shopifyResponse = await fetch(`https://${settings.shop_domain}/admin/api/2023-04/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": settings.access_token,
        "Content-Type": "application/json",
      },
    });
    
    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`Shopify API error: ${shopifyResponse.status} - ${errorText}`);
      
      let errorMessage = `Shopify API error (${shopifyResponse.status})`;
      if (shopifyResponse.status === 401) {
        errorMessage = "Authentication failed: Your access token is invalid or expired";
      } else if (shopifyResponse.status === 404) {
        errorMessage = "Shop not found: Verify your shop domain is correct";
      } else if (shopifyResponse.status === 429) {
        errorMessage = "Rate limit exceeded: Too many requests to the Shopify API";
      } else {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = `Shopify API error: ${errorData.errors || errorText}`;
        } catch {
          errorMessage = `Shopify API error: ${errorText.substring(0, 100)}`;
        }
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const shopData = await shopifyResponse.json();
    
    console.log("Successfully connected to Shopify!");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully connected to Shopify!",
        shop: shopData.shop.name,
        domain: shopData.shop.domain,
        plan: shopData.shop.plan_name
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "An unexpected error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
