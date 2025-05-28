
export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  console.log(`[CLEAR-CACHE API] ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { game } = body;
      
      console.log(`[CLEAR-CACHE API] Request to clear cache for game: ${game || 'all'}`);
      
      // Since we're using a simple in-memory cache approach, we'll just log this
      // The actual cache clearing happens in the main API file
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Cache clear request processed for ${game || 'all games'}` 
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error: any) {
      console.error('[CLEAR-CACHE API ERROR]:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to clear cache', 
          details: error.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
