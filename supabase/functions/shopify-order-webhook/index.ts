import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get the webhook data
    const orderData = await req.json();
    
    console.log('Received Shopify order webhook:', orderData.id);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each line item in the order
    for (const lineItem of orderData.line_items) {
      console.log(`Processing line item: ${lineItem.variant_id} (qty: ${lineItem.quantity})`);

      // Find the inventory item by Shopify variant ID
      const { data: inventoryItem, error: findError } = await supabase
        .from('card_inventory')
        .select('*')
        .eq('shopify_variant_id', lineItem.variant_id.toString())
        .single();

      if (findError || !inventoryItem) {
        console.warn(`No inventory item found for variant ${lineItem.variant_id}`);
        continue;
      }

      // Record the sale in our tracking table
      const { error: trackingError } = await supabase
        .from('shopify_sales_tracking')
        .insert({
          shopify_order_id: orderData.id.toString(),
          shopify_order_number: orderData.order_number?.toString(),
          line_item_id: lineItem.id.toString(),
          shopify_product_id: lineItem.product_id?.toString(),
          shopify_variant_id: lineItem.variant_id.toString(),
          inventory_item_id: inventoryItem.id,
          quantity_sold: lineItem.quantity,
          price: parseFloat(lineItem.price),
          total_amount: parseFloat(lineItem.price) * lineItem.quantity,
          currency: orderData.currency,
          sku: lineItem.sku,
          webhook_data: orderData
        });

      if (trackingError) {
        console.error('Error recording sale:', trackingError);
      }

      // Update inventory status to 'sold' since these are typically single items
      const { error: updateError } = await supabase
        .from('card_inventory')
        .update({
          status: 'sold',
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryItem.id);

      if (updateError) {
        console.error(`Error updating inventory item ${inventoryItem.id}:`, updateError);
      } else {
        console.log(`Updated inventory item ${inventoryItem.id} to 'sold' status`);
      }

      // Create inventory movement record
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_item_id: inventoryItem.id,
          movement_type: 'sale',
          quantity_before: 1, // Assuming single quantity items
          quantity_change: -lineItem.quantity,
          quantity_after: 0,
          reason: `Sold via Shopify order #${orderData.order_number}`,
          reference_type: 'shopify_order',
          reference_id: orderData.id.toString()
        });

      if (movementError) {
        console.error('Error recording inventory movement:', movementError);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});