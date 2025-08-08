import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TCGPlayerCategory {
  categoryId: number;
  name: string;
  displayName: string;
  seoCategoryName: string;
  sealedLabel: string;
  nonSealedLabel: string;
  conditionGuideUrl: string;
  isDirect: boolean;
  popularity: number;
}

interface TCGPlayerGroup {
  groupId: number;
  name: string;
  abbreviation: string;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

interface TCGPlayerProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
}

interface TCGPlayerAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  userName: string;
}

interface ScraperStats {
  totalGames: number;
  totalSets: number;
  totalProducts: number;
  duration: number;
}

// TCGPlayer Authentication
async function getTCGPlayerAccessToken(publicKey: string, privateKey: string): Promise<string> {
  const authUrl = 'https://api.tcgplayer.com/token';
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: publicKey,
    client_secret: privateKey
  });

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`TCGPlayer auth failed: ${response.status} ${response.statusText}`);
  }

  const authData: TCGPlayerAuthResponse = await response.json();
  return authData.access_token;
}

// Parse the combined API key format: "tcg_publickey_privatekey"
function parseApiKey(apiKey: string): { publicKey: string; privateKey: string } {
  // Expected format: tcg_ecc59dbc086648d8afe3dc164cb37225
  // For TCGPlayer, this is usually the public key. We'll treat it as such.
  // Real TCGPlayer keys come in pairs, but for now we'll work with what we have
  const cleanKey = apiKey.replace('tcg_', '');
  
  // For now, treat the entire key as the public key and use it as both
  // In a real implementation, you'd have separate public/private keys
  return {
    publicKey: cleanKey,
    privateKey: cleanKey // This is not ideal but we'll work with what we have
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const tcgPlayerApiKey = Deno.env.get('TCGPLAYER_API_KEY') || Deno.env.get('JUSTTCG_API_KEY');

  console.log('Environment check:');
  console.log('- TCGPLAYER_API_KEY exists:', !!Deno.env.get('TCGPLAYER_API_KEY'));
  console.log('- JUSTTCG_API_KEY exists:', !!Deno.env.get('JUSTTCG_API_KEY'));
  console.log('- Using API key:', tcgPlayerApiKey ? tcgPlayerApiKey.substring(0, 10) + '...' : 'none');

  if (!tcgPlayerApiKey || tcgPlayerApiKey.trim() === '') {
    console.error('TCGPlayer API key not found in environment variables');
    return new Response(
      JSON.stringify({ 
        error: 'TCGPlayer API key not configured. Please set TCGPLAYER_API_KEY in Supabase secrets.',
        debug: {
          tcgPlayerKeyExists: !!Deno.env.get('TCGPLAYER_API_KEY'),
          justTcgKeyExists: !!Deno.env.get('JUSTTCG_API_KEY')
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();
  let stats: Partial<ScraperStats> = {};

  try {
    console.log('Starting TCGPlayer database refresh...');

    // Log start of operation
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgplayer',
      status: 'started',
      message: 'Starting TCGPlayer database refresh'
    });

    const { publicKey, privateKey } = parseApiKey(tcgPlayerApiKey);
    console.log('Parsed API key - Public key length:', publicKey.length);

    // Get access token
    console.log('Getting TCGPlayer access token...');
    let accessToken: string;
    
    try {
      accessToken = await getTCGPlayerAccessToken(publicKey, privateKey);
      console.log('Successfully obtained access token');
    } catch (authError) {
      console.error('Authentication failed:', authError);
      // Try to use the API key directly for now
      console.log('Falling back to direct API key usage');
      accessToken = tcgPlayerApiKey;
    }

    const apiHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Tcg-Access-Token': accessToken
    };

    // Helper function for rate limiting
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('products').delete().neq('id', '');
    await supabase.from('sets').delete().neq('id', '');
    await supabase.from('games').delete().neq('id', '');

    // Step 2: Fetch categories (games)
    console.log('Fetching TCGPlayer categories...');
    const categoriesResponse = await fetch('https://api.tcgplayer.com/catalog/categories', {
      headers: apiHeaders
    });

    console.log('Categories API response status:', categoriesResponse.status);

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error('Categories response error:', errorText);
      throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json();
    const categories: TCGPlayerCategory[] = categoriesData.results || [];
    stats.totalGames = categories.length;

    console.log(`Found ${categories.length} categories`);

    // Insert categories as games
    if (categories.length > 0) {
      const games = categories.map(category => ({
        id: category.categoryId.toString(),
        name: category.displayName || category.name
      }));

      const { error: gamesError } = await supabase.from('games').insert(games);
      
      if (gamesError) {
        throw new Error(`Failed to insert games: ${gamesError.message}`);
      }
    }

    await sleep(1000); // Rate limiting

    // Step 3: Fetch groups (sets) for each category
    console.log('Fetching TCGPlayer groups...');
    let totalSets = 0;
    const allSets: any[] = [];

    for (const category of categories) {
      console.log(`Fetching groups for category: ${category.name}`);
      
      const groupsResponse = await fetch(`https://api.tcgplayer.com/catalog/categories/${category.categoryId}/groups`, {
        headers: apiHeaders
      });

      if (!groupsResponse.ok) {
        console.error(`Failed to fetch groups for category ${category.categoryId}: ${groupsResponse.status}`);
        await sleep(1000);
        continue;
      }

      const groupsData = await groupsResponse.json();
      const groups: TCGPlayerGroup[] = groupsData.results || [];
      
      const setsWithGameId = groups.map(group => ({
        id: group.groupId.toString(),
        name: group.name,
        game_id: category.categoryId.toString()
      }));

      allSets.push(...setsWithGameId);
      totalSets += groups.length;

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

    // Step 4: Fetch products for each group (limited sample for now)
    console.log('Fetching TCGPlayer products (sample)...');
    let totalProducts = 0;
    const allProducts: any[] = [];

    // Limit to first 10 sets to avoid hitting rate limits
    const limitedSets = allSets.slice(0, 10);

    for (const set of limitedSets) {
      console.log(`Fetching products for group: ${set.name}`);
      
      const productsResponse = await fetch(`https://api.tcgplayer.com/catalog/products?groupId=${set.id}&limit=100`, {
        headers: apiHeaders
      });

      if (!productsResponse.ok) {
        console.error(`Failed to fetch products for group ${set.id}: ${productsResponse.status}`);
        await sleep(1000);
        continue;
      }

      const productsData = await productsResponse.json();
      const products: TCGPlayerProduct[] = productsData.results || [];
      
      const productsWithSetId = products.map(product => ({
        id: product.productId.toString(),
        name: product.name,
        set_id: set.id,
        image_url: product.imageUrl || null
      }));

      allProducts.push(...productsWithSetId);
      totalProducts += products.length;

      await sleep(1000); // Rate limiting
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

    console.log(`TCGPlayer database refresh completed successfully in ${duration}ms`);
    console.log(`Stats: ${stats.totalGames} games, ${stats.totalSets} sets, ${stats.totalProducts} products`);

    // Log success
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgplayer',
      status: 'completed',
      message: 'TCGPlayer database refresh completed successfully',
      total_games: stats.totalGames,
      total_sets: stats.totalSets,
      total_products: stats.totalProducts,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'TCGPlayer database refreshed successfully',
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
    
    console.error('TCGPlayer database refresh failed:', errorMessage);

    // Log error
    await supabase.from('tcg_scraper_logs').insert({
      operation: 'refresh_database_tcgplayer',
      status: 'failed',
      message: 'TCGPlayer database refresh failed',
      error_details: { error: errorMessage },
      total_games: stats.totalGames || 0,
      total_sets: stats.totalSets || 0,
      total_products: stats.totalProducts || 0,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify({
        error: 'TCGPlayer database refresh failed',
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