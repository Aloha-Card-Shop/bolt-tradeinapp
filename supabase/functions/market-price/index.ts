const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Return a placeholder response until we implement the new pricing method
  return new Response(
    JSON.stringify({
      price: 10.00
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
});