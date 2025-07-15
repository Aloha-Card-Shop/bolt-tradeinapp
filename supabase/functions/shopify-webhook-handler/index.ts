import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { createHmac } from 'https://deno.land/std@0.208.0/crypto/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
}

interface ShopifyOrder {
  id: number
  order_number: string
  line_items: Array<{
    id: number
    product_id: number
    variant_id: number
    sku: string
    quantity: number
    price: string
    total_discount: string
  }>
  total_price: string
  currency: string
  created_at: string
}

async function verifyShopifyWebhook(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
  
  return signature === expectedSignature
}

async function logInventoryMovement(
  supabase: any,
  inventoryItemId: string,
  quantityChange: number,
  quantityBefore: number,
  quantityAfter: number,
  orderId: string
) {
  const { error } = await supabase
    .from('inventory_movements')
    .insert({
      inventory_item_id: inventoryItemId,
      movement_type: 'sale',
      quantity_change: quantityChange,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reason: 'Shopify sale',
      reference_id: orderId,
      reference_type: 'shopify_order'
    })

  if (error) {
    console.error('Error logging inventory movement:', error)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request headers
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256')
    const shopifyTopic = req.headers.get('x-shopify-topic')
    const shopifyDomain = req.headers.get('x-shopify-shop-domain')

    if (!shopifyHmac || !shopifyTopic) {
      console.error('Missing required Shopify headers')
      return new Response(
        JSON.stringify({ error: 'Missing required headers' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const body = await req.text()
    
    // Get Shopify settings for webhook verification
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_settings')
      .select('api_secret')
      .single()

    if (settingsError || !settings) {
      console.error('Failed to fetch Shopify settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Webhook verification failed' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify webhook signature
    const isValid = await verifyShopifyWebhook(body, shopifyHmac, settings.api_secret)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: corsHeaders }
      )
    }

    console.log(`Processing Shopify webhook: ${shopifyTopic} from ${shopifyDomain}`)

    // Parse order data
    const order: ShopifyOrder = JSON.parse(body)

    if (shopifyTopic !== 'orders/create' && shopifyTopic !== 'orders/paid') {
      console.log(`Ignoring webhook topic: ${shopifyTopic}`)
      return new Response(
        JSON.stringify({ message: 'Webhook topic ignored' }),
        { status: 200, headers: corsHeaders }
      )
    }

    console.log(`Processing order ${order.order_number} with ${order.line_items.length} items`)

    // Process each line item
    const processedItems = []
    const errors = []

    for (const lineItem of order.line_items) {
      try {
        if (!lineItem.sku) {
          console.log(`Skipping line item ${lineItem.id} - no SKU`)
          continue
        }

        // Find matching inventory item by SKU
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from('card_inventory')
          .select('*')
          .eq('sku', lineItem.sku)
          .eq('status', 'available')
          .limit(1)

        if (inventoryError) {
          console.error(`Error finding inventory for SKU ${lineItem.sku}:`, inventoryError)
          errors.push({ sku: lineItem.sku, error: inventoryError.message })
          continue
        }

        if (!inventoryItems || inventoryItems.length === 0) {
          console.log(`No inventory found for SKU: ${lineItem.sku}`)
          errors.push({ sku: lineItem.sku, error: 'No inventory found' })
          continue
        }

        const inventoryItem = inventoryItems[0]
        
        // Log the sale in sales tracking
        const { error: salesError } = await supabase
          .from('shopify_sales_tracking')
          .insert({
            shopify_order_id: order.id.toString(),
            shopify_order_number: order.order_number,
            line_item_id: lineItem.id.toString(),
            shopify_product_id: lineItem.product_id?.toString(),
            shopify_variant_id: lineItem.variant_id?.toString(),
            sku: lineItem.sku,
            quantity_sold: lineItem.quantity,
            price: parseFloat(lineItem.price),
            total_amount: parseFloat(lineItem.price) * lineItem.quantity,
            currency: order.currency,
            inventory_item_id: inventoryItem.id,
            processed: false,
            webhook_data: { order, line_item: lineItem }
          })

        if (salesError) {
          console.error(`Error logging sale for SKU ${lineItem.sku}:`, salesError)
          errors.push({ sku: lineItem.sku, error: salesError.message })
          continue
        }

        // Update inventory status to sold
        const { error: updateError } = await supabase
          .from('card_inventory')
          .update({ 
            status: 'sold',
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryItem.id)

        if (updateError) {
          console.error(`Error updating inventory for SKU ${lineItem.sku}:`, updateError)
          errors.push({ sku: lineItem.sku, error: updateError.message })
          continue
        }

        // Log inventory movement
        await logInventoryMovement(
          supabase,
          inventoryItem.id,
          -lineItem.quantity,
          1, // before: available
          0, // after: sold
          order.id.toString()
        )

        // Mark sale as processed
        await supabase
          .from('shopify_sales_tracking')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('shopify_order_id', order.id.toString())
          .eq('line_item_id', lineItem.id.toString())

        processedItems.push({
          sku: lineItem.sku,
          quantity: lineItem.quantity,
          inventory_id: inventoryItem.id
        })

        console.log(`Successfully processed sale for SKU: ${lineItem.sku}`)

      } catch (itemError) {
        console.error(`Error processing line item ${lineItem.id}:`, itemError)
        errors.push({ 
          sku: lineItem.sku, 
          error: itemError.message || 'Unknown error' 
        })
      }
    }

    console.log(`Webhook processing completed: ${processedItems.length} items processed, ${errors.length} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedItems.length} items from order ${order.order_number}`,
        processed_items: processedItems,
        errors: errors
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})