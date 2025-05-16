
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
  metafields?: ShopifyMetafield[];
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
  cost: string | null;
}

interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  value_type: string;
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
  customer_name?: string;
  total_value: number;
  trade_in_date: string;
  items: TradeInItem[];
  payment_type?: string;
}

interface ShopifyMapping {
  id: string;
  source_field: string;
  target_field: string;
  transform_template: string | null;
  is_active: boolean;
  mapping_type: 'product' | 'variant' | 'metadata';
  sort_order: number;
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Create two clients - one with anon key for initial auth check
    const supabase = createClient(supabaseUrl, supabaseKey);
    // And one with service role key for operations that might need to bypass RLS
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Invalid request body:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request body format" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    const { tradeInId, userId } = requestBody;
    
    if (!tradeInId) {
      console.error("Missing trade-in ID in request");
      return new Response(
        JSON.stringify({ success: false, error: "Trade-in ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    console.log(`Processing trade-in sync request for ID: ${tradeInId}`);

    // First check if trade-in exists (without joining other tables)
    const { data: tradeInCheck, error: checkError } = await supabase
      .from("trade_ins")
      .select("id, shopify_synced")
      .eq("id", tradeInId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking trade-in:", checkError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error checking trade-in: ${checkError.message}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    if (!tradeInCheck) {
      console.error(`Trade-in with ID ${tradeInId} not found`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Trade-in with ID ${tradeInId} not found` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404
        }
      );
    }

    // Check if already synced
    if (tradeInCheck.shopify_synced) {
      console.error("Trade-in already synced to Shopify");
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

    // Get trade-in details
    const { data: tradeIn, error: tradeInError } = await supabase
      .from("trade_ins")
      .select(`
        id,
        customer_id,
        total_value,
        trade_in_date,
        payment_type,
        customers (
          first_name,
          last_name
        ),
        trade_in_items (
          id,
          card_id,
          quantity,
          price,
          condition,
          attributes,
          cards:card_id (name, image_url, set_name, game, card_number, rarity)
        )
      `)
      .eq("id", tradeInId)
      .maybeSingle();

    if (tradeInError || !tradeIn) {
      console.error("Error fetching trade-in:", tradeInError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error fetching trade-in details: ${tradeInError?.message || "Not found"}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    // Get Shopify API credentials and mappings
    const { data: shopifySettings, error: settingsError } = await supabase
      .from("shopify_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError || !shopifySettings) {
      console.error("Error fetching Shopify settings:", settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error fetching Shopify settings: ${settingsError?.message || "Not found"}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    const { shop_domain, access_token } = shopifySettings;

    const { data: mappingsData, error: mappingsError } = await supabase
      .from("shopify_field_mappings")
      .select("*")
      .eq("is_active", true)
      .order("mapping_type")
      .order("sort_order");

    if (mappingsError) {
      console.error("Error fetching field mappings:", mappingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error fetching field mappings: ${mappingsError.message}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    const mappings: ShopifyMapping[] = mappingsData || [];
    
    // Process each item
    const items = tradeIn.trade_in_items;
    if (!items || items.length === 0) {
      console.error("No items found in this trade-in");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No items found in this trade-in" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Prepare customer name
    let customerName = "Unknown";
    if (tradeIn.customers) {
      customerName = `${tradeIn.customers.first_name} ${tradeIn.customers.last_name}`.trim();
    }

    const results = [];

    for (const item of items) {
      try {
        // Enhanced error checking for card data
        if (!item.cards) {
          throw new Error(`Card data not found for item ${item.id}`);
        }

        // Prepare data for template transformation
        const templateData = {
          card_name: item.cards.name || "Unknown Card",
          set_name: item.cards.set_name || "",
          card_number: item.cards.card_number || "",
          condition: formatCondition(item.condition),
          price: item.price,
          // For cost, use the appropriate value based on payment type
          cost: item.attributes?.paymentType === "cash" 
            ? (item.attributes?.cashValue || item.price) 
            : (item.attributes?.tradeValue || item.price),
          cashValue: item.attributes?.cashValue || item.price,
          tradeValue: item.attributes?.tradeValue || item.price,
          paymentType: item.attributes?.paymentType || "cash",
          quantity: item.quantity,
          image_url: item.cards.image_url || "",
          game_type: item.cards.game || "unknown",
          customer_name: customerName,
          trade_in_id: tradeIn.id,
          trade_in_date: new Date(tradeIn.trade_in_date).toISOString().split('T')[0],
          payment_type: tradeIn.payment_type || "cash",
          is_first_edition: item.attributes?.isFirstEdition || false,
          is_holo: item.attributes?.isHolo || false,
          is_reverse_holo: item.attributes?.isReverseHolo || false,
          card_type: formatCardType(
            item.attributes?.isFirstEdition || false, 
            item.attributes?.isHolo || false, 
            item.attributes?.isReverseHolo || false
          ),
          rarity: item.cards.rarity || "",
          product_id: item.cards.attributes?.productId || item.cards.attributes?.tcgplayer_id || ""
        };

        // Apply mappings to create product data
        const productMappings = mappings.filter(m => m.mapping_type === 'product');
        const variantMappings = mappings.filter(m => m.mapping_type === 'variant');
        const metadataMappings = mappings.filter(m => m.mapping_type === 'metadata');
        
        // Default product data (fallback if no mappings)
        let productData: Record<string, any> = {
          title: `${templateData.card_name} - ${templateData.condition}`,
          body_html: `<p>Trading card: ${templateData.card_name}</p><p>Condition: ${templateData.condition}</p>`,
          vendor: "Card Shop",
          product_type: "Trading Card",
          variants: [{
            price: item.price.toString(),
            sku: `TRADE-${tradeIn.id.substring(0, 8)}-${item.id.substring(0, 8)}`,
            inventory_management: "shopify",
            inventory_quantity: item.quantity,
            option1: templateData.condition,
            weight: 1,
            weight_unit: "oz"
          }]
        };

        // If mappings exist, apply them
        if (productMappings.length > 0) {
          productData = applyMappings(productMappings, templateData);
          
          // Ensure required fields have defaults if not mapped
          if (!productData.title) productData.title = `${templateData.card_name} - ${templateData.condition}`;
          if (!productData.body_html) productData.body_html = `<p>Trading card: ${templateData.card_name}</p>`;
          if (!productData.vendor) productData.vendor = "Card Shop";
          if (!productData.product_type) productData.product_type = "Trading Card";
        }

        // Process image if provided
        if (templateData.image_url) {
          productData.images = [{ src: templateData.image_url }];
        }

        // Process variant mappings
        let variantData: Record<string, any> = {
          price: item.price.toString(),
          sku: `TRADE-${tradeIn.id.substring(0, 8)}-${item.id.substring(0, 8)}`,
          inventory_management: "shopify",
          inventory_quantity: item.quantity,
          option1: templateData.condition,
          weight: 1,
          weight_unit: "oz"
        };

        if (variantMappings.length > 0) {
          variantData = applyMappings(variantMappings, templateData);
          
          // Ensure required fields have defaults if not mapped
          if (!variantData.price) variantData.price = item.price.toString();
          if (!variantData.sku) variantData.sku = `TRADE-${tradeIn.id.substring(0, 8)}-${item.id.substring(0, 8)}`;
          if (!variantData.inventory_quantity) variantData.inventory_quantity = item.quantity;
          if (!variantData.option1) variantData.option1 = templateData.condition;
          
          // Always add these values, whether they're mapped or not
          variantData.inventory_management = "shopify";
          variantData.weight = 1;
          variantData.weight_unit = "oz";
        }

        // Process metadata mappings
        if (metadataMappings.length > 0) {
          const metafields = processMetafields(metadataMappings, templateData);
          if (metafields.length > 0) {
            productData.metafields = metafields;
          }
        }

        // Include variant data in product
        productData.variants = [variantData];

        console.log("Creating product in Shopify:", productData);
        
        // Create product in Shopify
        const productResponse = await fetch(`https://${shop_domain}/admin/api/2023-07/products.json`, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product: productData }),
        });

        if (!productResponse.ok) {
          let errorDetails = "";
          try {
            const errorData = await productResponse.json();
            errorDetails = JSON.stringify(errorData);
          } catch (e) {
            errorDetails = await productResponse.text();
          }
          
          throw new Error(`Shopify API error (${productResponse.status}): ${errorDetails}`);
        }

        const productResponseData = await productResponse.json();
        const product = productResponseData.product as ShopifyProduct;
        
        if (!product || !product.variants || product.variants.length === 0) {
          throw new Error("Invalid product data returned from Shopify");
        }
        
        const variant = product.variants[0];

        // Update the trade-in item with Shopify IDs - use adminSupabase to bypass RLS
        await adminSupabase
          .from("trade_in_items")
          .update({
            shopify_product_id: product.id,
            shopify_variant_id: variant.id,
            shopify_inventory_item_id: variant.inventory_item_id,
            shopify_sync_status: "synced",
            shopify_synced_at: new Date().toISOString()
          })
          .eq("id", item.id);

        // Log the sync - use adminSupabase to bypass RLS
        await adminSupabase
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
        
        // Log the error - use adminSupabase to bypass RLS
        try {
          await adminSupabase
            .from("shopify_sync_logs")
            .insert({
              trade_in_id: tradeIn.id,
              item_id: item.id,
              status: "error",
              message: (itemError as Error).message,
              created_by: userId
            });
        } catch (logError) {
          console.error("Could not log error to database:", logError);
        }

        results.push({
          item_id: item.id,
          status: "error",
          error: (itemError as Error).message
        });
      }
    }

    // Mark the trade-in as synced if at least one item was successful
    const hasSuccess = results.some(r => r.status === "success");
    
    if (hasSuccess) {
      // Use adminSupabase to bypass RLS
      await adminSupabase
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
        error: (error as Error).message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

// Helper function to process metafields based on mappings
function processMetafields(
  metadataMappings: ShopifyMapping[], 
  data: Record<string, any>
): ShopifyMetafield[] {
  const metafieldGroups: Record<string, Record<string, any>> = {};
  
  // Group metafield entries by their index
  for (const mapping of metadataMappings) {
    if (!mapping.is_active) continue;
    
    const match = mapping.target_field.match(/metafields\[(\d+)\]\.(.+)/);
    if (!match) continue;
    
    const [, index, property] = match;
    if (!metafieldGroups[index]) metafieldGroups[index] = {};
    
    let value;
    if (mapping.transform_template) {
      value = applyTemplate(mapping.transform_template, data);
    } else {
      value = data[mapping.source_field];
    }
    
    metafieldGroups[index][property] = value;
  }
  
  // Create metafield objects from groups
  const metafields: ShopifyMetafield[] = [];
  for (const groupKey in metafieldGroups) {
    const group = metafieldGroups[groupKey];
    if (group.key && group.namespace && group.value) {
      metafields.push({
        key: group.key,
        namespace: group.namespace,
        value: group.value,
        value_type: group.value_type || 'string'
      });
    }
  }
  
  return metafields;
}

// Helper function to format condition string
function formatCondition(condition: string): string {
  if (!condition) return "Unknown";
  
  return condition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format card type based on attributes
function formatCardType(isFirstEdition: boolean, isHolo: boolean, isReverseHolo: boolean): string {
  if (isFirstEdition && isHolo) return "1st Edition Holo";
  if (isFirstEdition) return "1st Edition";
  if (isHolo) return "Holo";
  if (isReverseHolo) return "Reverse Holo";
  return "Standard";
}

// Helper function to apply mappings
function applyMappings(
  mappings: ShopifyMapping[], 
  data: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const mapping of mappings) {
    if (!mapping.is_active) continue;
    
    let value;
    
    // If there's a transform template, use it
    if (mapping.transform_template) {
      value = applyTemplate(mapping.transform_template, data);
    } else {
      // Direct mapping
      value = data[mapping.source_field];
    }
    
    // Handle nested properties (e.g., "variant.option1")
    if (mapping.target_field.includes('.')) {
      const [parent, child] = mapping.target_field.split('.');
      if (!result[parent]) result[parent] = {};
      result[parent][child] = value;
    } else {
      result[mapping.target_field] = value;
    }
  }
  
  return result;
}

// Helper function to apply template with enhanced functionality for string methods
function applyTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/{([^}]+)}/g, (match, expr) => {
    // Handle expressions with methods like {condition.charAt(0)}
    if (expr.includes('.')) {
      const parts = expr.split('.');
      const fieldName = parts[0].trim();
      const methodPart = parts.slice(1).join('.').trim();
      
      // Get the base value
      let value = data[fieldName];
      if (value === undefined || value === null) {
        // Check if there's a default value provided
        const defaultMatch = expr.match(/\|(.+)$/);
        return defaultMatch ? defaultMatch[1].trim() : '';
      }
      
      // Handle string methods
      try {
        // Convert value to string if it's not already
        if (typeof value !== 'string') {
          value = String(value);
        }
        
        // Support for common string methods
        if (methodPart.startsWith('charAt(') && methodPart.endsWith(')')) {
          const index = parseInt(methodPart.substring(7, methodPart.length - 1), 10);
          return value.charAt(index);
        }
        
        if (methodPart.startsWith('substring(') && methodPart.endsWith(')')) {
          const args = methodPart.substring(10, methodPart.length - 1).split(',').map(arg => parseInt(arg.trim(), 10));
          return value.substring(args[0], args[1]);
        }
        
        if (methodPart === 'toUpperCase()') {
          return value.toUpperCase();
        }
        
        if (methodPart === 'toLowerCase()') {
          return value.toLowerCase();
        }
        
        // New: Support for replace() method with string patterns
        if (methodPart.startsWith('replace(') && methodPart.endsWith(')')) {
          const argsStr = methodPart.substring(8, methodPart.length - 1);
          // Split by comma but not inside quotes
          const args = argsStr.match(/('[^']*'|"[^"]*"|[^,]+)/g);
          if (args && args.length === 2) {
            const search = args[0].trim().replace(/^['"]|['"]$/g, '');  // Remove quotes
            const replacement = args[1].trim().replace(/^['"]|['"]$/g, '');  // Remove quotes
            return value.replace(new RegExp(search, 'g'), replacement);
          }
        }
        
        // If the method is not recognized, return the original value
        return String(value);
      } catch (e) {
        console.error(`Error applying string method ${methodPart} to ${fieldName}:`, e);
        return String(value);
      }
    }
    
    // Original functionality for simple field references
    const [fieldName, defaultValue] = expr.split('|');
    const value = data[fieldName.trim()];
    return (value !== undefined && value !== null) ? String(value) : (defaultValue?.trim() || '');
  });
}
