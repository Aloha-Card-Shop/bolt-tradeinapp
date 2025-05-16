
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateAdmin, createResponse, createClients, handleCors } from "../_shared/auth.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate the user
    const { userId, role, error: authError } = await authenticateAdmin(req);
    
    if (authError) {
      return createResponse({ success: false, error: authError }, 403);
    }
    
    // Get clients
    const { supabase, adminSupabase } = createClients();
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return createResponse({ 
        success: false, 
        error: "Invalid request body format" 
      }, 400);
    }
    
    const { tradeInItemId, updates } = requestBody;
    
    if (!tradeInItemId || !updates) {
      return createResponse({ 
        success: false, 
        error: "Missing required fields: tradeInItemId and updates" 
      }, 400);
    }
    
    // Fetch trade-in item with Shopify IDs
    const { data: item, error: itemError } = await supabase
      .from("trade_in_items")
      .select(`
        id,
        trade_in_id,
        card_id,
        quantity,
        price,
        condition,
        attributes,
        shopify_product_id,
        shopify_variant_id,
        shopify_inventory_item_id
      `)
      .eq("id", tradeInItemId)
      .maybeSingle();
    
    if (itemError || !item) {
      await adminSupabase.from("shopify_sync_logs").insert({
        item_id: tradeInItemId,
        status: "error",
        message: `Failed to fetch item data: ${itemError?.message || 'Item not found'}`,
        created_by: userId
      });
      
      return createResponse({ 
        success: false, 
        error: `Failed to fetch item data: ${itemError?.message || 'Item not found'}` 
      }, 404);
    }
    
    // Check if item has Shopify product ID
    if (!item.shopify_product_id || !item.shopify_variant_id) {
      await adminSupabase.from("shopify_sync_logs").insert({
        item_id: tradeInItemId,
        trade_in_id: item.trade_in_id,
        status: "error",
        message: "Item has not been synced to Shopify yet",
        created_by: userId
      });
      
      return createResponse({ 
        success: false, 
        error: "Item has not been synced to Shopify yet" 
      }, 400);
    }
    
    // Get Shopify API credentials
    const { data: shopifySettings, error: settingsError } = await supabase
      .from("shopify_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError || !shopifySettings) {
      await adminSupabase.from("shopify_sync_logs").insert({
        item_id: tradeInItemId,
        trade_in_id: item.trade_in_id,
        status: "error",
        message: `Failed to fetch Shopify settings: ${settingsError?.message || 'Settings not found'}`,
        created_by: userId
      });
      
      return createResponse({ 
        success: false, 
        error: `Failed to fetch Shopify settings: ${settingsError?.message || 'Settings not found'}` 
      }, 500);
    }

    const { shop_domain, access_token } = shopifySettings;
    
    try {
      // Prepare update data
      let updateData: Record<string, any> = {};
      
      // Handle specific update types
      if (updates.quantity !== undefined && item.shopify_inventory_item_id) {
        // Update inventory levels
        const inventoryResponse = await fetch(
          `https://${shop_domain}/admin/api/2023-07/inventory_levels/set.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": access_token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              inventory_item_id: item.shopify_inventory_item_id,
              location_id: updates.location_id || "all", // Default to first location
              available: updates.quantity
            }),
          }
        );
        
        if (!inventoryResponse.ok) {
          const errorText = await inventoryResponse.text();
          throw new Error(`Failed to update inventory: ${errorText}`);
        }
        
        updateData.quantity = updates.quantity;
      }
      
      // Handle price updates for variants
      if (updates.price !== undefined && item.shopify_variant_id) {
        const variantResponse = await fetch(
          `https://${shop_domain}/admin/api/2023-07/variants/${item.shopify_variant_id}.json`,
          {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": access_token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              variant: {
                id: item.shopify_variant_id,
                price: updates.price.toString()
              }
            }),
          }
        );
        
        if (!variantResponse.ok) {
          const errorText = await variantResponse.text();
          throw new Error(`Failed to update variant price: ${errorText}`);
        }
        
        updateData.price = updates.price;
      }
      
      // Update product title or other fields if needed
      if (updates.title && item.shopify_product_id) {
        const productResponse = await fetch(
          `https://${shop_domain}/admin/api/2023-07/products/${item.shopify_product_id}.json`,
          {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": access_token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              product: {
                id: item.shopify_product_id,
                title: updates.title
              }
            }),
          }
        );
        
        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          throw new Error(`Failed to update product title: ${errorText}`);
        }
        
        updateData.title = updates.title;
      }
      
      // Update local status in database
      await adminSupabase
        .from("trade_in_items")
        .update({
          shopify_sync_status: "updated",
          shopify_synced_at: new Date().toISOString()
        })
        .eq("id", item.id);
      
      // Log the successful update
      await adminSupabase
        .from("shopify_sync_logs")
        .insert({
          trade_in_id: item.trade_in_id,
          item_id: item.id,
          status: "success",
          message: `Product updated: ${JSON.stringify(updateData)}`,
          created_by: userId
        });
      
      return createResponse({ 
        success: true, 
        data: updateData,
        message: "Product successfully updated in Shopify"
      });
    } catch (error) {
      // Log the error
      await adminSupabase
        .from("shopify_sync_logs")
        .insert({
          item_id: tradeInItemId,
          trade_in_id: item.trade_in_id,
          status: "error",
          message: `Error updating product: ${error.message}`,
          created_by: userId
        });
      
      return createResponse({ 
        success: false, 
        error: `Error updating product: ${error.message}` 
      }, 500);
    }
  } catch (error) {
    console.error("Error in shopify_update_product function:", error);
    return createResponse({ 
      success: false, 
      error: error.message || "Internal server error" 
    }, 500);
  }
});
