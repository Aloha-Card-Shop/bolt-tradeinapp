
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Define types for Shopify API responses and parameters
interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: ShopifyVariant[];
}

interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  inventory_item_id: string;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface TradeInItem {
  id: string;
  card_id: string;
  card_name: string;
  quantity: number;
  price: number;
  condition: string;
  attributes: any;
  tcgplayer_url?: string;
  image_url?: string;
}

interface TradeIn {
  id: string;
  customer_id: string;
  total_value: number;
  items: TradeInItem[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { tradeInId, userId } = await req.json();
    
    if (!tradeInId) {
      throw new Error("Trade-in ID is required");
    }

    // Get trade-in details
    const { data: tradeIn, error: tradeInError } = await supabase
      .from("trade_ins")
      .select(`
        id,
        customer_id,
        total_value,
        shopify_synced,
        trade_in_items (
          id,
          card_id,
          quantity,
          price,
          condition,
          attributes,
          cards:card_id (name, image_url)
        )
      `)
      .eq("id", tradeInId)
      .single();

    if (tradeInError || !tradeIn) {
      throw new Error(`Error fetching trade-in: ${tradeInError?.message || "Not found"}`);
    }

    // Check if already synced
    if (tradeIn.shopify_synced) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "This trade-in has already been synced to Shopify" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Get Shopify API credentials
    const { data: shopifySettings, error: settingsError } = await supabase
      .from("shopify_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !shopifySettings) {
      throw new Error(`Error fetching Shopify settings: ${settingsError?.message || "Not found"}`);
    }

    const { shop_domain, access_token } = shopifySettings;

    // Process each item
    const items = tradeIn.trade_in_items;
    const results = [];

    for (const item of items) {
      try {
        const cardName = item.cards?.name || "Unknown Card";
        const imageUrl = item.cards?.image_url || "";
        const condition = item.condition;
        
        // Create product in Shopify
        const productResponse = await fetch(`https://${shop_domain}/admin/api/2023-07/products.json`, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: {
              title: `${cardName} - ${condition}`,
              body_html: `<p>Trading card: ${cardName}</p><p>Condition: ${condition}</p>`,
              vendor: "Card Shop",
              product_type: "Trading Card",
              images: imageUrl ? [{ src: imageUrl }] : [],
              variants: [
                {
                  price: item.price.toString(),
                  sku: `TRADE-${tradeIn.id.substring(0, 8)}-${item.id.substring(0, 8)}`,
                  inventory_management: "shopify",
                  inventory_quantity: item.quantity,
                  option1: condition,
                }
              ]
            }
          }),
        });

        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(`Shopify API error: ${JSON.stringify(errorData)}`);
        }

        const productData = await productResponse.json();
        const product = productData.product as ShopifyProduct;
        const variant = product.variants[0];

        // Update the trade-in item with Shopify IDs
        await supabase
          .from("trade_in_items")
          .update({
            shopify_product_id: product.id,
            shopify_variant_id: variant.id,
            shopify_inventory_item_id: variant.inventory_item_id,
            shopify_sync_status: "synced",
            shopify_synced_at: new Date().toISOString()
          })
          .eq("id", item.id);

        // Log the sync
        await supabase
          .from("shopify_sync_logs")
          .insert({
            trade_in_id: tradeIn.id,
            item_id: item.id,
            status: "success",
            message: `Product created: ${product.id}`,
            created_by: userId
          });

        results.push({
          item_id: item.id,
          shopify_product_id: product.id,
          status: "success"
        });
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        
        // Log the error
        await supabase
          .from("shopify_sync_logs")
          .insert({
            trade_in_id: tradeIn.id,
            item_id: item.id,
            status: "error",
            message: itemError.message,
            created_by: userId
          });

        results.push({
          item_id: item.id,
          status: "error",
          error: itemError.message
        });
      }
    }

    // Mark the trade-in as synced if at least one item was successful
    const hasSuccess = results.some(r => r.status === "success");
    
    if (hasSuccess) {
      await supabase
        .from("trade_ins")
        .update({
          shopify_synced: true,
          shopify_synced_at: new Date().toISOString(),
          shopify_synced_by: userId
        })
        .eq("id", tradeIn.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        allSuccessful: results.every(r => r.status === "success")
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in shopify-sync function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
