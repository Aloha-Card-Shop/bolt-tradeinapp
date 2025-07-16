import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyCollection {
  id: number
  handle: string
  title: string
  body_html?: string
  image?: {
    src: string
  }
  products_count: number
  collection_type: string
  published: boolean
  updated_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active Shopify settings
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    console.log('Shopify settings query result:', { 
      settings: settings ? { 
        shop_domain: settings.shop_domain,
        has_access_token: !!settings.access_token,
        is_active: settings.is_active
      } : null, 
      settingsError 
    })

    if (settingsError) {
      console.error('Database error fetching Shopify settings:', settingsError)
      return new Response(
        JSON.stringify({ 
          error: 'Database error fetching Shopify settings', 
          details: settingsError.message 
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (!settings) {
      console.error('No active Shopify settings found in database')
      return new Response(
        JSON.stringify({ error: 'No active Shopify settings configured' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const shopifyUrl = `https://${settings.shop_domain}`
    const headers = {
      'X-Shopify-Access-Token': settings.access_token,
      'Content-Type': 'application/json',
    }

    console.log('Fetching collections from Shopify...')

    // Fetch all collections from Shopify
    let allCollections: ShopifyCollection[] = []
    let nextPageInfo = null
    let hasNextPage = true

    // Test connection first with shop info endpoint
    console.log('Testing Shopify API connection...')
    const testUrl = `${shopifyUrl}/admin/api/2024-10/shop.json`
    const testResponse = await fetch(testUrl, { headers })
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Shopify API connection test failed:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        url: testUrl,
        headers: Object.fromEntries(testResponse.headers.entries()),
        body: errorText
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Shopify API. Please verify your access token has the correct permissions (read_products, read_collections)',
          details: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            body: errorText,
            url: testUrl,
            suggestion: testResponse.status === 401 ? 'Invalid access token' : 
                       testResponse.status === 403 ? 'Access token lacks required permissions' :
                       testResponse.status === 404 ? 'Invalid shop domain or API version' :
                       'Unknown API error'
          }
        }),
        { status: testResponse.status, headers: corsHeaders }
      )
    }

    const shopInfo = await testResponse.json()
    console.log('Shopify connection successful. Shop:', shopInfo.shop?.name || 'Unknown')

    while (hasNextPage) {
      let url = `${shopifyUrl}/admin/api/2024-10/collections.json?limit=250`
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`
      }

      console.log('Fetching from URL:', url)
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Shopify API error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        })
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch collections from Shopify',
            details: {
              status: response.status,
              statusText: response.statusText,
              body: errorText,
              url: url,
              suggestion: response.status === 401 ? 'Invalid access token' : 
                         response.status === 403 ? 'Access token lacks read_collections permission' :
                         response.status === 404 ? 'Collections endpoint not found - verify API version and shop domain' :
                         'Unknown API error'
            }
          }),
          { status: response.status, headers: corsHeaders }
        )
      }

      const data = await response.json()
      allCollections = allCollections.concat(data.collections || [])

      // Check for pagination
      const linkHeader = response.headers.get('link')
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/)
        nextPageInfo = nextMatch ? nextMatch[1] : null
        hasNextPage = !!nextPageInfo
      } else {
        hasNextPage = false
      }
    }

    console.log(`Fetched ${allCollections.length} collections from Shopify`)

    // Update collections in database
    const upsertPromises = allCollections.map(async (collection) => {
      const collectionData = {
        shopify_collection_id: collection.id.toString(),
        handle: collection.handle,
        title: collection.title,
        description: collection.body_html || null,
        image_url: collection.image?.src || null,
        product_count: collection.products_count,
        collection_type: collection.collection_type,
        published: collection.published,
        last_synced_at: new Date().toISOString(),
      }

      // Upsert collection
      const { error: upsertError } = await supabase
        .from('shopify_collections')
        .upsert(collectionData, { 
          onConflict: 'shopify_collection_id',
          ignoreDuplicates: false 
        })

      if (upsertError) {
        console.error(`Error upserting collection ${collection.id}:`, upsertError)
        return { success: false, collection_id: collection.id, error: upsertError }
      }

      return { success: true, collection_id: collection.id }
    })

    const results = await Promise.all(upsertPromises)
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`Collections sync completed: ${successCount} success, ${errorCount} errors`)

    // Get updated collections list
    const { data: collections, error: collectionsError } = await supabase
      .from('shopify_collections')
      .select(`
        *,
        shopify_collection_sync_settings(*)
      `)
      .order('title')

    if (collectionsError) {
      console.error('Error fetching updated collections:', collectionsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${successCount} collections successfully`,
        errors: errorCount,
        collections: collections || [],
        total_collections: allCollections.length
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in collections sync:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})