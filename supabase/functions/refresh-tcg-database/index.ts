import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Game {
  id: string;
  name: string;
}

interface Set {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  image?: string;
}

interface ScraperStats {
  totalGames: number;
  totalSets: number;
  totalProducts: number;
  duration: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const justTcgApiKey = Deno.env.get('JUSTTCG_API_KEY');

  if (!justTcgApiKey) {
    return new Response(
      JSON.stringify({ error: 'JUSTTCG_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();
  let stats: Partial<ScraperStats> = {};

  try {
    console.log('Starting TCG database refresh...');

    // Log start of operation
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database',
      status: 'started',
      message: 'Starting full database refresh'
    });

    // Helper function for rate limiting (60 requests per minute = 1 per second)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Clear existing data (in reverse dependency order)
    console.log('Clearing existing data...');
    await supabase.from('products').delete().neq('id', '');
    await supabase.from('sets').delete().neq('id', '');
    await supabase.from('games').delete().neq('id', '');

    // Step 2: Fetch and insert games
    console.log('Fetching games...');
    console.log('Making request to JustTCG API with key:', justTcgApiKey ? 'Key exists' : 'No key found');
    
    const gamesResponse = await fetch('https://api.justtcg.com/v1/games', {
      headers: {
        'X-API-Key': justTcgApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!gamesResponse.ok) {
      throw new Error(`Failed to fetch games: ${gamesResponse.status} ${gamesResponse.statusText}`);
    }

    const gamesData = await gamesResponse.json();
    const games: Game[] = gamesData.data || [];
    stats.totalGames = games.length;

    console.log(`Found ${games.length} games`);

    // Insert games
    if (games.length > 0) {
      const { error: gamesError } = await supabase
        .from('games')
        .insert(games.map(game => ({ id: game.id, name: game.name })));

      if (gamesError) {
        throw new Error(`Failed to insert games: ${gamesError.message}`);
      }
    }

    await sleep(1000); // Rate limiting

    // Step 3: Fetch and insert sets for each game
    console.log('Fetching sets...');
    let totalSets = 0;
    const allSets: any[] = [];

    for (const game of games) {
      console.log(`Fetching sets for game: ${game.name}`);
      
      const setsResponse = await fetch(`https://api.justtcg.com/v1/sets?game=${game.id}`, {
        headers: {
          'X-API-Key': justTcgApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!setsResponse.ok) {
        console.error(`Failed to fetch sets for game ${game.id}: ${setsResponse.status}`);
        continue;
      }

      const setsData = await setsResponse.json();
      const sets: Set[] = setsData.data || [];
      
      // Add game_id to each set
      const setsWithGameId = sets.map(set => ({
        id: set.id,
        name: set.name,
        game_id: game.id
      }));

      allSets.push(...setsWithGameId);
      totalSets += sets.length;

      await sleep(1000); // Rate limiting
    }

    stats.totalSets = totalSets;
    console.log(`Found ${totalSets} total sets`);

    // Insert sets in batches
    if (allSets.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < allSets.length; i += batchSize) {
        const batch = allSets.slice(i, i + batchSize);
        const { error: setsError } = await supabase.from('sets').insert(batch);
        
        if (setsError) {
          throw new Error(`Failed to insert sets batch: ${setsError.message}`);
        }
      }
    }

    // Step 4: Fetch and insert products for each set
    console.log('Fetching products...');
    let totalProducts = 0;
    const allProducts: any[] = [];

    for (const set of allSets) {
      console.log(`Fetching products for set: ${set.name}`);
      
      const productsResponse = await fetch(`https://api.justtcg.com/v1/products?set=${set.id}`, {
        headers: {
          'X-API-Key': justTcgApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for set ${set.id}: ${productsResponse.status}`);
        continue;
      }

      const productsData = await productsResponse.json();
      const products: Product[] = productsData.data || [];
      
      // Add set_id to each product and handle image
      const productsWithSetId = products.map(product => ({
        id: product.id,
        name: product.name,
        set_id: set.id,
        image_url: product.image || null
      }));

      allProducts.push(...productsWithSetId);
      totalProducts += products.length;

      await sleep(1000); // Rate limiting
    }

    stats.totalProducts = totalProducts;
    console.log(`Found ${totalProducts} total products`);

    // Insert products in batches
    if (allProducts.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        const { error: productsError } = await supabase.from('products').insert(batch);
        
        if (productsError) {
          throw new Error(`Failed to insert products batch: ${productsError.message}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    stats.duration = duration;

    console.log(`Database refresh completed successfully in ${duration}ms`);
    console.log(`Stats: ${stats.totalGames} games, ${stats.totalSets} sets, ${stats.totalProducts} products`);

    // Log success
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database',
      status: 'completed',
      message: 'Database refresh completed successfully',
      total_games: stats.totalGames,
      total_sets: stats.totalSets,
      total_products: stats.totalProducts,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'TCG database refreshed successfully',
        stats: {
          games: stats.totalGames,
          sets: stats.totalSets,
          products: stats.totalProducts,
          duration: `${duration}ms`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Database refresh failed:', errorMessage);

    // Log error
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database',
      status: 'failed',
      message: 'Database refresh failed',
      error_details: { error: errorMessage },
      total_games: stats.totalGames || 0,
      total_sets: stats.totalSets || 0,
      total_products: stats.totalProducts || 0,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        error: 'Database refresh failed',
        message: errorMessage,
        stats
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});