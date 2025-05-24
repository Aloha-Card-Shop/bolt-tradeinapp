
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ebay-verification-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EbayAccountDeletionEvent {
  eventType: string;
  eventTime: string;
  accountId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Only POST requests are accepted.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the eBay verification token
    const verificationToken = req.headers.get('x-ebay-verification-token');
    const expectedToken = Deno.env.get('EBAY_VERIFICATION_TOKEN');

    if (!expectedToken) {
      console.error('EBAY_VERIFICATION_TOKEN environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!verificationToken || verificationToken !== expectedToken) {
      console.log(`Verification failed. Received: ${verificationToken}, Expected: ${expectedToken ? '[SET]' : '[NOT SET]'}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid verification token.' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the incoming JSON payload
    let eventData: EbayAccountDeletionEvent;
    try {
      eventData = await req.json();
    } catch (parseError) {
      console.error('Failed to parse JSON payload:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    if (!eventData.eventType || !eventData.eventTime || !eventData.accountId) {
      console.error('Missing required fields in payload:', eventData);
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventType, eventTime, and accountId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the account deletion event
    console.log('eBay Account Deletion Event Received:', {
      eventType: eventData.eventType,
      eventTime: eventData.eventTime,
      accountId: eventData.accountId,
      timestamp: new Date().toISOString()
    });

    // Optional: Store in database if table exists
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from("ebay_account_deletions")
          .insert({
            account_id: eventData.accountId,
            event_time: eventData.eventTime,
            raw_payload: eventData,
            received_at: new Date().toISOString()
          });
        
        console.log('Account deletion event stored in database');
      }
    } catch (dbError) {
      console.log('Failed to store in database (table may not exist):', dbError);
      // Don't fail the request if database storage fails
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Account deletion notification received successfully',
        eventType: eventData.eventType,
        accountId: eventData.accountId,
        processedAt: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing account deletion notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
