
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body to extract price information
    const requestData = await req.json().catch(() => ({}));
    
    // Extract price from the request if available
    const providedPrice = requestData.price;
    
    // Enhanced logging to track all request parameters
    console.log('Market price function called with complete data:', JSON.stringify({
      requestData,
      providedPrice,
      productId: requestData.productId,
      game: requestData.game
    }));

    // If a price is provided in the request, use it
    if (providedPrice && !isNaN(Number(providedPrice))) {
      const normalizedPrice = Number(providedPrice);
      console.log(`Using provided price: ${normalizedPrice} (raw value: ${providedPrice})`);
      
      // Return the processed price with detailed information
      return new Response(
        JSON.stringify({
          price: normalizedPrice,
          raw_price: providedPrice,
          normalized: true,
          source: 'request',
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // If no price is provided, check for product ID
    if (!requestData.productId) {
      console.error('No price or product ID provided in request');
      return new Response(
        JSON.stringify({
          error: 'No price or product ID provided',
          price: 0,
          request_data: requestData
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    // Log product ID for debugging
    console.log(`Processing request for product ID: ${requestData.productId}, game: ${requestData.game || 'unknown'}`);
    
    // In future, implement actual price fetching logic here
    // For now, return detailed debug information
    return new Response(
      JSON.stringify({
        price: 0,
        error: 'Price calculation not implemented',
        needsImplementation: true,
        productId: requestData.productId,
        game: requestData.game || 'unknown',
        timestamp: new Date().toISOString()
      }),
      {
        status: 501, // Not Implemented
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error in market price function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        error_type: error.constructor.name,
        price: 0,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
