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

    // Parse body params for chunked/full refresh
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const mode: 'full' | 'sample' = body?.mode ?? 'sample';
    const start: boolean = body?.start ?? false;
    const categoryIds: number[] | undefined = body?.categoryIds;
    const setOffset: number = Number(body?.setOffset ?? 0);
    const setLimit: number = Number(body?.setLimit ?? 25);

    // Log start of operation
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgcsv',
      status: 'started',
      message: `Starting TCGCSV database refresh (mode=${mode}, start=${start}, setOffset=${setOffset}, setLimit=${setLimit})`
    });

    // Helper function for rate limiting
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Wipe only when explicitly requested on a full refresh first call
    if (mode === 'full' && start) {
      console.log('Clearing existing data (full wipe)...');
      await supabase.from('products').delete().neq('id', '');
      await supabase.from('sets').delete().neq('id', '');
      await supabase.from('games').delete().neq('id', '');
    }

    // Fetch categories (games) from tcgcsv.com
    console.log('Fetching TCGCSV categories...');
    const categoriesResponse = await fetch('https://tcgcsv.com/tcgplayer/categories', {
      headers: { 'User-Agent': 'TCG-Database-Refresh/1.1' }
    });

    console.log('Categories API response status:', categoriesResponse.status);

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error('Categories response error:', errorText);
      throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json();
    console.log('Raw categories response length:', Array.isArray(categoriesData?.results) ? categoriesData.results.length : Array.isArray(categoriesData) ? categoriesData.length : 'unknown');

    // Handle tcgcsv.com response format which has results array nested in object
    let categories: TCGCSVCategory[];
    if (Array.isArray(categoriesData)) {
      categories = categoriesData as TCGCSVCategory[];
    } else if (categoriesData && Array.isArray(categoriesData.results)) {
      categories = categoriesData.results as TCGCSVCategory[];
    } else {
      console.error('Categories response format unexpected:', typeof categoriesData);
      throw new Error(`Invalid categories response format: expected array or object with results array`);
    }
    stats.totalGames = categories.length;

    // Filter categories if requested
    let selectedCategories = categories;
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const setIds = new Set(categoryIds);
      selectedCategories = categories.filter(c => setIds.has(c.categoryId));
    }

    // Default behavior for sample: only Pokemon (3) or first 3 categories
    if (mode === 'sample') {
      const pokemon = categories.find(c => c.categoryId === 3);
      selectedCategories = pokemon ? [pokemon] : categories.slice(0, 3);
    }

    // Upsert categories into games table
    if (categories.length > 0) {
      const games = categories.map(category => ({ id: category.categoryId.toString(), name: category.name }));
      const { error: gamesError } = await supabase.from('games').upsert(games, { onConflict: 'id' });
      if (gamesError) {
        throw new Error(`Failed to upsert games: ${gamesError.message}`);
      }
    }

    await sleep(300);

    console.log(`Fetching sets for ${selectedCategories.length} categories...`);
    // Collect sets for the selected categories
    const allSets: Array<{ id: string; name: string; game_id: string }> = [];

    for (const category of selectedCategories) {
      console.log(`Fetching sets for category: ${category.name} (${category.categoryId})`);

      const setsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${category.categoryId}/groups`, {
        headers: { 'User-Agent': 'TCG-Database-Refresh/1.1' }
      });

      if (!setsResponse.ok) {
        console.error(`Failed to fetch sets for category ${category.categoryId}: ${setsResponse.status}`);
        await sleep(300);
        continue;
      }

      const setsData = await setsResponse.json();
      // Handle tcgcsv.com response format
      let sets: TCGCSVSet[];
      if (Array.isArray(setsData)) {
        sets = setsData as TCGCSVSet[];
      } else if (setsData && Array.isArray(setsData.results)) {
        sets = setsData.results as TCGCSVSet[];
      } else {
        console.error(`Sets response for ${category.name} format unexpected:`, typeof setsData);
        await sleep(300);
        continue;
      }

      const setsWithGameId = sets.map(set => ({ id: set.groupId.toString(), name: set.name, game_id: category.categoryId.toString() }));
      allSets.push(...setsWithGameId);
      await sleep(300);
    }

    stats.totalSets = allSets.length;

    // Upsert sets in batches
    if (allSets.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < allSets.length; i += batchSize) {
        const batch = allSets.slice(i, i + batchSize);
        const { error: setsError } = await supabase.from('sets').upsert(batch, { onConflict: 'id' });
        if (setsError) {
          throw new Error(`Failed to upsert sets batch: ${setsError.message}`);
        }
      }
    }

    // Determine which sets to process for products (chunked for full, small sample otherwise)
    let setsToProcess: Array<{ id: string; name: string; game_id: string }>; 
    let totalSetsAll = allSets.length;
    if (mode === 'full') {
      const startIdx = Math.max(0, setOffset);
      const endIdx = Math.min(totalSetsAll, startIdx + Math.max(1, setLimit));
      setsToProcess = allSets.slice(startIdx, endIdx);
    } else {
      setsToProcess = allSets.slice(0, 5); // small sample
    }

    // Fetch and upsert products for selected sets
    let processedProducts = 0;
    const productRows: Array<{ id: string; name: string; set_id: string; image_url: string | null }> = [];

    for (const set of setsToProcess) {
      console.log(`Fetching products for set: ${set.name}`);
      const productsResponse = await fetch(`https://tcgcsv.com/tcgplayer/${set.game_id}/${set.id}/products`, {
        headers: { 'User-Agent': 'TCG-Database-Refresh/1.1' }
      });

      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for set ${set.id}: ${productsResponse.status}`);
        await sleep(300);
        continue;
      }

      const productsData = await productsResponse.json();
      let products: TCGCSVProduct[];
      if (Array.isArray(productsData)) {
        products = productsData as TCGCSVProduct[];
      } else if (productsData && Array.isArray(productsData.results)) {
        products = productsData.results as TCGCSVProduct[];
      } else {
        console.error(`Products response for ${set.name} format unexpected:`, typeof productsData);
        await sleep(300);
        continue;
      }

      const mapped = products.map(p => ({ id: p.productId.toString(), name: p.name, set_id: set.id, image_url: p.imageUrl || null }));
      productRows.push(...mapped);
      processedProducts += mapped.length;
      await sleep(300);
    }

    // Upsert products in batches
    if (productRows.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < productRows.length; i += batchSize) {
        const batch = productRows.slice(i, i + batchSize);
        const { error: productsError } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
        if (productsError) {
          throw new Error(`Failed to upsert products batch: ${productsError.message}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    stats.totalProducts = processedProducts;
    stats.duration = duration;

    // Determine progress for full mode
    let progress: any = undefined;
    if (mode === 'full') {
      const processedSets = setsToProcess.length;
      const next = setOffset + processedSets;
      const done = next >= totalSetsAll;
      progress = { setOffset, nextSetOffset: next, processedSets, totalSets: totalSetsAll, done };

      await supabase.from('tcg_scraper_logs').insert({
        operation: 'refresh_database_tcgcsv',
        status: done ? 'completed' : 'in_progress',
        message: done ? 'Full refresh completed for all sets' : `Processed ${processedSets} sets in this chunk`,
        total_games: stats.totalGames,
        total_sets: totalSetsAll,
        total_products: stats.totalProducts,
        duration_ms: duration
      });

      return new Response(
        JSON.stringify({ success: true, mode, start, stats: { games: stats.totalGames, sets: setsToProcess.length, products: processedProducts, duration: `${duration}ms` }, progress }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sample mode success
    console.log(`Sample refresh completed successfully in ${duration}ms`);
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgcsv',
      status: 'completed',
      message: 'Sample refresh completed',
      total_games: stats.totalGames,
      total_sets: stats.totalSets,
      total_products: stats.totalProducts,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({ success: true, mode, stats: { games: stats.totalGames, sets: stats.totalSets, products: processedProducts, duration: `${duration}ms` }, progress: { done: true } }),
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
      JSON.stringify({ error: 'TCGCSV database refresh failed', message: errorMessage, stats }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});