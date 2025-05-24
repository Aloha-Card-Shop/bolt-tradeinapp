
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ebay-verification-token, x-ebay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface EbayAccountDeletionNotification {
  metadata: {
    topic: string;
  };
  notification: {
    notificationId: string;
    eventDate: string;
    data: {
      username: string;
      userId: string;
      eiasToken: string;
    };
  };
}

// Helper function to create SHA-256 hash
async function createSHA256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // GET REQUEST - Challenge Code Verification
    if (req.method === 'GET') {
      const challengeCode = url.searchParams.get('challenge_code');
      
      if (!challengeCode) {
        return new Response(
          JSON.stringify({ error: 'Missing challenge_code parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get verification token and endpoint URL from environment
      const verificationToken = Deno.env.get('EBAY_VERIFICATION_TOKEN');
      const endpointUrl = Deno.env.get('PUBLIC_ENDPOINT_URL');

      if (!verificationToken) {
        console.error('EBAY_VERIFICATION_TOKEN environment variable is not set');
        return new Response(
          JSON.stringify({ error: 'Server configuration error: verification token missing' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!endpointUrl) {
        console.error('PUBLIC_ENDPOINT_URL environment variable is not set');
        return new Response(
          JSON.stringify({ error: 'Server configuration error: endpoint URL missing' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create hash: challenge_code + verification_token + endpoint_url
      const hashInput = challengeCode + verificationToken + endpointUrl;
      const challengeResponse = await createSHA256Hash(hashInput);

      console.log('eBay Challenge Request:', {
        challengeCode,
        endpointUrl,
        challengeResponse,
        timestamp: new Date().toISOString()
      });

      // Return challenge response
      return new Response(
        JSON.stringify({ challengeResponse }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // POST REQUEST - Account Deletion Notification
    if (req.method === 'POST') {
      // Verify the eBay verification token in header (if provided)
      const verificationToken = req.headers.get('x-ebay-verification-token');
      const expectedToken = Deno.env.get('EBAY_VERIFICATION_TOKEN');

      if (expectedToken && verificationToken && verificationToken !== expectedToken) {
        console.log(`Verification failed. Received: ${verificationToken}, Expected: [REDACTED]`);
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Invalid verification token.' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Parse the incoming JSON payload
      let notificationData: EbayAccountDeletionNotification;
      try {
        notificationData = await req.json();
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

      // Validate notification structure
      if (!notificationData.metadata?.topic || 
          !notificationData.notification?.data?.userId ||
          !notificationData.notification?.data?.username) {
        console.error('Invalid notification structure:', notificationData);
        return new Response(
          JSON.stringify({ error: 'Invalid notification structure' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Log the account deletion notification
      console.log('eBay Account Deletion Notification Received:', {
        topic: notificationData.metadata.topic,
        notificationId: notificationData.notification.notificationId,
        eventDate: notificationData.notification.eventDate,
        username: notificationData.notification.data.username,
        userId: notificationData.notification.data.userId,
        timestamp: new Date().toISOString()
      });

      // Store in database if table exists
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabase
            .from("ebay_account_deletions")
            .insert({
              username: notificationData.notification.data.username,
              user_id: notificationData.notification.data.userId,
              eias_token: notificationData.notification.data.eiasToken,
              event_date: notificationData.notification.eventDate,
              notification_id: notificationData.notification.notificationId,
              topic: notificationData.metadata.topic,
              raw_payload: notificationData,
              received_at: new Date().toISOString()
            });
          
          console.log('Account deletion notification stored in database');
        }
      } catch (dbError) {
        console.log('Failed to store in database (table may not exist):', dbError);
        // Don't fail the request if database storage fails
      }

      // Return immediate acknowledgment (200 OK or 202 Accepted)
      return new Response(
        null,
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only GET and POST requests are supported.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing eBay request:', error);
    
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
