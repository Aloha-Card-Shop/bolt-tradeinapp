import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { collectionId } = await req.json();

    if (!collectionId) {
      return new Response(
        JSON.stringify({ error: 'Collection ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('shopify_collections')
      .select('shopify_collection_id, title')
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Shopify settings
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_settings')
      .select('shop_domain, access_token')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Shopify settings not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching products from Shopify collection: ${collection.shopify_collection_id}`);

    // Fetch products from Shopify collection
    let allProducts: any[] = [];
    let hasNextPage = true;
    let pageInfo = '';

    while (hasNextPage) {
      const url = new URL(`https://${settings.shop_domain}/admin/api/2025-07/collections/${collection.shopify_collection_id}/products.json`);
      url.searchParams.append('limit', '250');
      if (pageInfo) {
        url.searchParams.append('page_info', pageInfo);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'X-Shopify-Access-Token': settings.access_token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      allProducts = allProducts.concat(data.products);

      // Check for pagination
      const linkHeader = response.headers.get('link');
      hasNextPage = linkHeader ? linkHeader.includes('rel="next"') : false;
      
      if (hasNextPage && linkHeader) {
        const nextLinkMatch = linkHeader.match(/<[^>]+page_info=([^>]+)>;\s*rel="next"/);
        pageInfo = nextLinkMatch ? nextLinkMatch[1] : '';
      }
    }

    console.log(`Found ${allProducts.length} products in collection "${collection.title}"`);

    // Process each product and check if it exists in our inventory
    const productSummary = [];
    let syncedCount = 0;
    let existingCount = 0;

    for (const product of allProducts) {
      // Check if product has variants and if variants is an array
      const variants = Array.isArray(product.variants) ? product.variants : [];
      console.log(`Product "${product.title}" has ${variants.length} variants`);
      
      if (variants.length === 0) {
        console.warn(`Product "${product.title}" has no variants, skipping`);
        continue;
      }

      for (const variant of variants) {
        // Check if this product variant exists in our card_inventory
        const { data: existingInventory } = await supabase
          .from('card_inventory')
          .select('id, sku, shopify_product_id, shopify_variant_id')
          .eq('shopify_product_id', product.id.toString())
          .eq('shopify_variant_id', variant.id.toString());

        if (existingInventory && existingInventory.length > 0) {
          existingCount++;
          productSummary.push({
            title: product.title,
            variant_title: variant.title || 'Default Title',
            sku: variant.sku || '',
            price: variant.price || '0.00',
            status: 'exists_in_inventory'
          });
        } else {
          // This product is in Shopify but not in our inventory
          productSummary.push({
            title: product.title,
            variant_title: variant.title || 'Default Title',
            sku: variant.sku || '',
            price: variant.price || '0.00',
            shopify_product_id: product.id,
            shopify_variant_id: variant.id,
            status: 'shopify_only'
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Fetched ${allProducts.length} products from "${collection.title}"`,
        collection: {
          id: collectionId,
          title: collection.title,
          shopify_collection_id: collection.shopify_collection_id
        },
        summary: {
          total_products: allProducts.length,
          total_variants: productSummary.length,
          existing_in_inventory: existingCount,
          shopify_only: productSummary.length - existingCount
        },
        products: productSummary
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching collection products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});