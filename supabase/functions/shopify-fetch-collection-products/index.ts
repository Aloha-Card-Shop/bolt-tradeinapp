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
    const batchSize = 5; // Reduced batch size to avoid rate limiting
    const delayBetweenBatches = 2000; // 2 second delay between batches
    
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batch = allProductIds.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}: products ${i + 1}-${Math.min(i + batchSize, allProductIds.length)}`);

      // Fetch products in parallel for this batch with retry logic
      const productPromises = batch.map(async (productId) => {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second delay between retries
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const productUrl = `https://${settings.shop_domain}/admin/api/2025-07/products/${productId}.json`;
            const productResponse = await fetch(productUrl, {
              headers: {
                'X-Shopify-Access-Token': settings.access_token,
                'Content-Type': 'application/json',
              },
            });

            if (productResponse.ok) {
              const productData = await productResponse.json();
              return productData.product;
            } else if (productResponse.status === 429) {
              // Rate limited, wait and retry
              console.log(`Rate limited on product ${productId}, attempt ${attempt}/${maxRetries}`);
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                continue;
              }
            }
            
            console.error(`Failed to fetch product ${productId}: ${productResponse.status}`);
            failedProducts.push({ id: productId, status: productResponse.status });
            return null;
          } catch (error) {
            console.error(`Error fetching product ${productId} (attempt ${attempt}):`, error);
            if (attempt === maxRetries) {
              failedProducts.push({ id: productId, error: error.message });
              return null;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }
        }
        return null;
      });

      const batchProducts = await Promise.all(productPromises);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < allProductIds.length) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }

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
            // This product is in Shopify but not in our inventory - create it
            const cardName = variant.title !== 'Default Title' ? `${product.title} - ${variant.title}` : product.title;
            
            // Create or find card for this product
            let cardId;
            const { data: existingCard } = await supabase
              .from('cards')
              .select('id')
              .eq('name', cardName)
              .single();
              
            if (existingCard) {
              cardId = existingCard.id;
            } else {
              // Create new card
              const { data: newCard, error: cardError } = await supabase
                .from('cards')
                .insert({
                  name: cardName,
                  image_url: product.image?.src || null,
                  game: 'pokemon', // Default to pokemon
                  market_price: parseFloat(variant.price) || 0,
                  attributes: {
                    shopify_product_id: product.id,
                    shopify_variant_id: variant.id,
                    handle: product.handle,
                    vendor: product.vendor,
                    product_type: product.product_type,
                    tags: product.tags
                  }
                })
                .select('id')
                .single();
                
              if (cardError) {
                console.error('Error creating card:', cardError);
                productSummary.push({
                  title: product.title,
                  variant_title: variant.title || 'Default Title',
                  sku: variant.sku || '',
                  price: variant.price || '0.00',
                  status: 'card_creation_failed',
                  error: cardError.message
                });
                continue;
              }
              
              cardId = newCard.id;
            }
            
            // Create inventory record
            const { error: inventoryError } = await supabase
              .from('card_inventory')
              .insert({
                card_id: cardId,
                trade_in_item_id: null, // NULL since it's not from a trade-in
                trade_in_price: 0,
                current_selling_price: parseFloat(variant.price) || 0,
                market_price: parseFloat(variant.price) || 0,
                shopify_product_id: product.id.toString(),
                shopify_variant_id: variant.id.toString(),
                shopify_synced: true,
                shopify_synced_at: new Date().toISOString(),
                status: 'available',
                import_source: 'shopify',
                sku: variant.sku || null
              });
              
            if (inventoryError) {
              console.error('Error creating inventory record:', inventoryError);
              productSummary.push({
                title: product.title,
                variant_title: variant.title || 'Default Title',
                sku: variant.sku || '',
                price: variant.price || '0.00',
                status: 'inventory_creation_failed',
                error: inventoryError.message
              });
            } else {
              productSummary.push({
                title: product.title,
                variant_title: variant.title || 'Default Title',
                sku: variant.sku || '',
                price: variant.price || '0.00',
                shopify_product_id: product.id,
                shopify_variant_id: variant.id,
                status: 'created_in_inventory'
              });
            }
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