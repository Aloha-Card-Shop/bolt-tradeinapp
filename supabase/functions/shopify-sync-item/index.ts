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
    const { inventoryItemId } = await req.json();

    if (!inventoryItemId) {
      return new Response(
        JSON.stringify({ error: 'Inventory item ID is required' }),
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

    // Get inventory item with card details
    const { data: inventoryItem, error: itemError } = await supabase
      .from('card_inventory')
      .select(`
        *,
        cards (
          id,
          name,
          image_url,
          game,
          set_name,
          attributes
        ),
        trade_in_items (
          condition,
          quantity
        )
      `)
      .eq('id', inventoryItemId)
      .single();

    if (itemError || !inventoryItem) {
      return new Response(
        JSON.stringify({ error: 'Inventory item not found' }),
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

    // Check if already synced to Shopify
    if (inventoryItem.shopify_synced && inventoryItem.shopify_product_id) {
      return new Response(
        JSON.stringify({ message: 'Item already synced to Shopify' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Syncing inventory item ${inventoryItemId} to Shopify`);

    // Prepare product data for Shopify
    const cardName = inventoryItem.cards.name;
    const condition = inventoryItem.trade_in_items?.condition || 'near_mint';
    const productTitle = `${cardName} - ${condition.replace('_', ' ')}`;
    
    const shopifyProduct = {
      product: {
        title: productTitle,
        body_html: `${cardName} in ${condition.replace('_', ' ')} condition from ${inventoryItem.cards.set_name || 'Unknown Set'}`,
        vendor: 'Card Shop',
        product_type: inventoryItem.cards.game || 'Trading Card',
        status: 'active',
        tags: [
          inventoryItem.cards.game,
          condition,
          inventoryItem.cards.set_name,
          'trade-in'
        ].filter(Boolean).join(','),
        images: inventoryItem.cards.image_url ? [
          {
            src: inventoryItem.cards.image_url,
            alt: cardName
          }
        ] : [],
        variants: [
          {
            title: 'Default Title',
            price: inventoryItem.current_selling_price?.toString() || inventoryItem.trade_in_price.toString(),
            sku: inventoryItem.sku || `CARD-${inventoryItem.id.slice(0, 8)}`,
            inventory_quantity: inventoryItem.trade_in_items?.quantity || 1,
            inventory_management: 'shopify',
            inventory_policy: 'deny'
          }
        ]
      }
    };

    // Create product in Shopify
    const shopifyUrl = `https://${settings.shop_domain}/admin/api/2025-07/products.json`;
    const shopifyResponse = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': settings.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shopifyProduct)
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`Shopify API error: ${shopifyResponse.status} - ${errorText}`);
      throw new Error(`Failed to create product in Shopify: ${shopifyResponse.status} - ${errorText}`);
    }

    const shopifyData = await shopifyResponse.json();
    console.log('Created Shopify product:', shopifyData.product.id);

    // Update inventory item with Shopify IDs
    const { error: updateError } = await supabase
      .from('card_inventory')
      .update({
        shopify_product_id: shopifyData.product.id.toString(),
        shopify_variant_id: shopifyData.product.variants[0].id.toString(),
        shopify_synced: true,
        shopify_synced_at: new Date().toISOString(),
        sku: shopifyData.product.variants[0].sku
      })
      .eq('id', inventoryItemId);

    if (updateError) {
      console.error('Error updating inventory item:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: 'Item successfully synced to Shopify',
        shopify_product_id: shopifyData.product.id,
        shopify_variant_id: shopifyData.product.variants[0].id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error syncing item to Shopify:', error);
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