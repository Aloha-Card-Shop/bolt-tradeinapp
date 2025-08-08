import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TCGCSVCategory {
  categoryId: number;
  name: string;
  displayName?: string;
}

interface TCGCSVSet {
  groupId: number;
  name: string;
  abbreviation?: string;
  categoryId?: number;
  publishedOn?: string;
}

interface TCGCSVProduct {
  productId: number;
  name: string;
  groupId?: number;
  cardNumber?: string;
  rarity?: string;
  imageUrl?: string;
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
    
    // Handle tcgcsv.com response format which has results array nested in object
    let categories: TCGCSVCategory[];
    if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    } else if (categoriesData && Array.isArray(categoriesData.results)) {
      categories = categoriesData.results;
    } else {
      console.error('Categories response format unexpected:', typeof categoriesData);
      throw new Error(`Invalid categories response format: expected array or object with results array`);
    }
    stats.totalGames = categories.length;

    console.log(`Found ${categories.length} categories`);

    // Insert categories as games
    if (categories.length > 0) {
      const games = categories.map(category => ({
        id: category.categoryId.toString(),
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

    // Focus on Pokemon (category id 3) first as a test
    const pokemonCategory = categories.find(cat => cat.categoryId === 3);
    const categoriesToProcess = pokemonCategory ? [pokemonCategory] : categories.slice(0, 3);

    for (const category of categoriesToProcess) {
      console.log(`Fetching sets for category: ${category.name}`);
      
      const setsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${category.categoryId}/groups`, {
        headers: {
          'User-Agent': 'TCG-Database-Refresh/1.0'
        }
      });

      if (!setsResponse.ok) {
        console.error(`Failed to fetch sets for category ${category.categoryId}: ${setsResponse.status}`);
        await sleep(500);
        continue;
      }

      const setsData = await setsResponse.json();
      console.log(`Raw sets response for ${category.name}:`, JSON.stringify(setsData, null, 2));
      
      // Handle tcgcsv.com response format
      let sets: TCGCSVSet[];
      if (Array.isArray(setsData)) {
        sets = setsData;
      } else if (setsData && Array.isArray(setsData.results)) {
        sets = setsData.results;
      } else {
        console.error(`Sets response for ${category.name} format unexpected:`, typeof setsData);
        await sleep(500);
        continue;
      }
      
      const setsWithGameId = sets.map(set => ({
        id: set.groupId.toString(),
        name: set.name,
        game_id: category.categoryId.toString()
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
      
      // Handle tcgcsv.com response format
      let products: TCGCSVProduct[];
      if (Array.isArray(productsData)) {
        products = productsData;
      } else if (productsData && Array.isArray(productsData.results)) {
        products = productsData.results;
      } else {
        console.error(`Products response for ${set.name} format unexpected:`, typeof productsData);
        await sleep(500);
        continue;
      }
      
      const productsWithSetId = products.map(product => ({
        id: product.productId.toString(),
        name: product.name,
        set_id: set.id,
        image_url: product.imageUrl || null
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