import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TCGCSVCategory {
  id: string;
  name: string;
}

interface TCGCSVSet {
  id: string;
  name: string;
  abbreviation?: string;
  category_id: string;
  released_on?: string;
}

interface TCGCSVProduct {
  id: string;
  name: string;
  set_id: string;
  number?: string;
  rarity?: string;
  image_url?: string;
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();
  let stats: Partial<ScraperStats> = {};

  try {
    console.log('Starting TCGCSV database refresh...');

    // Log start of operation
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgcsv',
      status: 'started',
      message: 'Starting TCGCSV database refresh'
    });

    // Helper function for rate limiting
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('products').delete().neq('id', '');
    await supabase.from('sets').delete().neq('id', '');
    await supabase.from('games').delete().neq('id', '');

    // Step 2: Fetch categories (games) from tcgcsv.com
    console.log('Fetching TCGCSV categories...');
    const categoriesResponse = await fetch('https://tcgcsv.com/tcgplayer/categories', {
      headers: {
        'User-Agent': 'TCG-Database-Refresh/1.0'
      }
    });

    console.log('Categories API response status:', categoriesResponse.status);

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error('Categories response error:', errorText);
      throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json();
    console.log('Raw categories response:', JSON.stringify(categoriesData, null, 2));
    
    // Validate that we received an array of categories
    if (!Array.isArray(categoriesData)) {
      console.error('Categories response is not an array:', typeof categoriesData);
      throw new Error(`Invalid categories response format: expected array, got ${typeof categoriesData}`);
    }

    const categories: TCGCSVCategory[] = categoriesData;
    stats.totalGames = categories.length;

    console.log(`Found ${categories.length} categories`);

    // Insert categories as games
    if (categories.length > 0) {
      const games = categories.map(category => ({
        id: category.id,
        name: category.name
      }));

      const { error: gamesError } = await supabase.from('games').insert(games);
      
      if (gamesError) {
        throw new Error(`Failed to insert games: ${gamesError.message}`);
      }
    }

    await sleep(500); // Rate limiting for public API

    // Step 3: Fetch sets for each category
    console.log('Fetching TCGCSV sets...');
    let totalSets = 0;
    const allSets: any[] = [];

    // Focus on Pokemon (category id '3') first as a test
    const pokemonCategory = categories.find(cat => cat.id === '3');
    const categoriesToProcess = pokemonCategory ? [pokemonCategory] : categories.slice(0, 3);

    for (const category of categoriesToProcess) {
      console.log(`Fetching sets for category: ${category.name}`);
      
      const setsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${category.id}/groups`, {
        headers: {
          'User-Agent': 'TCG-Database-Refresh/1.0'
        }
      });

      if (!setsResponse.ok) {
        console.error(`Failed to fetch sets for category ${category.id}: ${setsResponse.status}`);
        await sleep(500);
        continue;
      }

      const setsData = await setsResponse.json();
      console.log(`Raw sets response for ${category.name}:`, JSON.stringify(setsData, null, 2));
      
      // Validate that we received an array of sets
      if (!Array.isArray(setsData)) {
        console.error(`Sets response for ${category.name} is not an array:`, typeof setsData);
        await sleep(500);
        continue;
      }
      
      const sets: TCGCSVSet[] = setsData;
      
      const setsWithGameId = sets.map(set => ({
        id: set.id,
        name: set.name,
        game_id: category.id
      }));

      allSets.push(...setsWithGameId);
      totalSets += sets.length;

      await sleep(500); // Rate limiting for public API
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

    // Step 4: Fetch products for sets (limited sample)
    console.log('Fetching TCGCSV products (sample)...');
    let totalProducts = 0;
    const allProducts: any[] = [];

    // Limit to first 5 sets to avoid overwhelming the API
    const limitedSets = allSets.slice(0, 5);

    for (const set of limitedSets) {
      console.log(`Fetching products for set: ${set.name}`);
      
      // Use the tcgcsv.com structure: /tcgplayer/{categoryId}/{groupId}/products
      const productsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${set.game_id}/${set.id}/products`, {
        headers: {
          'User-Agent': 'TCG-Database-Refresh/1.0'
        }
      });

      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for set ${set.id}: ${productsResponse.status}`);
        await sleep(500);
        continue;
      }

      const productsData = await productsResponse.json();
      console.log(`Raw products response for ${set.name}:`, JSON.stringify(productsData, null, 2));
      
      // Validate that we received an array of products
      if (!Array.isArray(productsData)) {
        console.error(`Products response for ${set.name} is not an array:`, typeof productsData);
        await sleep(500);
        continue;
      }
      
      const products: TCGCSVProduct[] = productsData;
      
      const productsWithSetId = products.map(product => ({
        id: product.id,
        name: product.name,
        set_id: set.id,
        image_url: product.image_url || null
      }));

      allProducts.push(...productsWithSetId);
      totalProducts += products.length;

      await sleep(500); // Rate limiting for public API
    }

    stats.totalProducts = totalProducts;
    console.log(`Found ${totalProducts} total products (sample)`);

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

    console.log(`TCGCSV database refresh completed successfully in ${duration}ms`);
    console.log(`Stats: ${stats.totalGames} games, ${stats.totalSets} sets, ${stats.totalProducts} products`);

    // Log success
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgcsv',
      status: 'completed',
      message: 'TCGCSV database refresh completed successfully',
      total_games: stats.totalGames,
      total_sets: stats.totalSets,
      total_products: stats.totalProducts,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'TCGCSV database refreshed successfully',
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
    
    console.error('TCGCSV database refresh failed:', errorMessage);

    // Log error
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgcsv',
      status: 'failed',
      message: 'TCGCSV database refresh failed',
      error_details: { error: errorMessage },
      total_games: stats.totalGames || 0,
      total_sets: stats.totalSets || 0,
      total_products: stats.totalProducts || 0,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        error: 'TCGCSV database refresh failed',
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