
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenCache {
  access_token: string;
  expires_in: number;
  token_type: string;
  expires_at: number; // Unix timestamp when token expires
}

interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// In-memory token cache with 60-second buffer
let tokenCache: TokenCache | null = null;
const EXPIRY_BUFFER_SECONDS = 60;

// Get eBay OAuth2 token using Client Credentials flow
async function getEbayToken(): Promise<EbayTokenResponse> {
  const clientId = Deno.env.get("EBAY_CLIENT_ID");
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET");
  const scope = Deno.env.get("EBAY_SCOPE") || "https://api.ebay.com/oauth/api_scope";
  
  if (!clientId || !clientSecret) {
    throw new Error("eBay credentials not configured - missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET");
  }
  
  console.log("Requesting new eBay OAuth token from production endpoint");
  
  // Create Basic Auth header
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  // Prepare form data for client credentials grant
  const formData = new URLSearchParams({
    grant_type: "client_credentials",
    scope: scope
  });
  
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`eBay OAuth token request failed: ${response.status} - ${errorText}`);
    throw new Error(`Failed to get eBay token: ${response.status} ${response.statusText}`);
  }
  
  const tokenData = await response.json() as EbayTokenResponse;
  
  console.log(`Successfully received eBay token - expires in ${tokenData.expires_in} seconds`);
  
  return tokenData;
}

// Check if cached token is still valid (with buffer)
function isCachedTokenValid(): boolean {
  if (!tokenCache) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const isValid = now < (tokenCache.expires_at - EXPIRY_BUFFER_SECONDS);
  
  if (!isValid) {
    console.log("Cached eBay token has expired or is within buffer zone");
  } else {
    console.log(`Cached eBay token is still valid for ${tokenCache.expires_at - now - EXPIRY_BUFFER_SECONDS} more seconds`);
  }
  
  return isValid;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received for eBay token`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    console.log(`Method ${req.method} not allowed - only GET requests accepted`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only GET requests are supported.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Check if we have a valid cached token
    if (isCachedTokenValid()) {
      console.log('Returning cached eBay token');
      return new Response(
        JSON.stringify({
          access_token: tokenCache!.access_token,
          expires_in: tokenCache!.expires_in,
          token_type: tokenCache!.token_type
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get fresh token from eBay
    const tokenData = await getEbayToken();
    
    // Cache the new token with expiration tracking
    const now = Math.floor(Date.now() / 1000);
    tokenCache = {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      expires_at: now + tokenData.expires_in
    };
    
    console.log('eBay token cached successfully');
    
    // Return the token response
    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-ebay-token function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error while fetching eBay token',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
