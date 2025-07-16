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

    // First, get the list of product IDs from the collection
    let allProductIds: string[] = [];
    let hasNextPage = true;
    let pageInfo = '';
    let pageCount = 0;

    while (hasNextPage) {
      pageCount++;
      const url = new URL(`https://${settings.shop_domain}/admin/api/2025-07/collections/${collection.shopify_collection_id}/products.json`);
      url.searchParams.append('limit', '250');
      url.searchParams.append('fields', 'id');
      if (pageInfo) {
        url.searchParams.append('page_info', pageInfo);
      }

      console.log(`Fetching product IDs (page ${pageCount}): ${url.toString()}`);

      const response = await fetch(url.toString(), {
        headers: {
          'X-Shopify-Access-Token': settings.access_token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.products?.length || 0} product IDs in this page`);
      
      if (data.products) {
        allProductIds = allProductIds.concat(data.products.map((p: any) => p.id.toString()));
      }

      // Check for pagination
      const linkHeader = response.headers.get('link');
      hasNextPage = linkHeader ? linkHeader.includes('rel="next"') : false;
      
      if (hasNextPage && linkHeader) {
        const nextLinkMatch = linkHeader.match(/<[^>]+page_info=([^>]+)>;\s*rel="next"/);
        pageInfo = nextLinkMatch ? nextLinkMatch[1] : '';
      }
      
      if (pageCount > 50) {
        console.warn('Breaking pagination loop after 50 pages');
        break;
      }
    }

    console.log(`Found ${allProductIds.length} product IDs. Now fetching full product details...`);

    // Now fetch each product individually to get full details including variants
    const productSummary = [];
    let existingCount = 0;
    let totalVariants = 0;
    let failedProducts = [];
    let productsWithoutVariants = [];

    // Process products in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batch = allProductIds.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: products ${i + 1}-${Math.min(i + batchSize, allProductIds.length)}`);

      // Fetch products in parallel for this batch
      const productPromises = batch.map(async (productId) => {
        try {
          const productUrl = `https://${settings.shop_domain}/admin/api/2025-07/products/${productId}.json`;
          const productResponse = await fetch(productUrl, {
            headers: {
              'X-Shopify-Access-Token': settings.access_token,
              'Content-Type': 'application/json',
            },
          });

          if (!productResponse.ok) {
            console.error(`Failed to fetch product ${productId}: ${productResponse.status}`);
            failedProducts.push({ id: productId, status: productResponse.status });
            return null;
          }

          const productData = await productResponse.json();
          return productData.product;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          failedProducts.push({ id: productId, error: error.message });
          return null;
        }
      });

      const batchProducts = await Promise.all(productPromises);

      // Process each product in this batch
      for (const product of batchProducts) {
        if (!product) continue;

        console.log(`Processing product: "${product.title}" (ID: ${product.id})`);
        
        const variants = Array.isArray(product.variants) ? product.variants : [];
        totalVariants += variants.length;
        console.log(`Product "${product.title}" has ${variants.length} variants`);
        
        if (variants.length === 0) {
          console.warn(`Product "${product.title}" has no variants!`);
          productsWithoutVariants.push({
            id: product.id,
            title: product.title,
            status: product.status
          });
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
    }

    console.log(`Processed ${allProductIds.length} products with ${totalVariants} total variants`);
    console.log(`Failed to fetch ${failedProducts.length} products:`, failedProducts);
    console.log(`Found ${productsWithoutVariants.length} products without variants:`, productsWithoutVariants);

    return new Response(
      JSON.stringify({
        message: `Fetched ${allProductIds.length} products from "${collection.title}" with ${totalVariants} variants`,
        collection: {
          id: collectionId,
          title: collection.title,
          shopify_collection_id: collection.shopify_collection_id
        },
        summary: {
          total_products: allProductIds.length,
          total_variants: totalVariants,
          existing_in_inventory: existingCount,
          shopify_only: productSummary.length - existingCount,
          failed_products: failedProducts.length,
          products_without_variants: productsWithoutVariants.length
        },
        failed_products: failedProducts,
        products_without_variants: productsWithoutVariants,
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