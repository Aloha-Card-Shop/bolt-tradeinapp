import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Shopify settings
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'No active Shopify settings found' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const shopifyUrl = `https://${settings.shop_domain}`
    const headers = {
      'X-Shopify-Access-Token': settings.access_token,
      'Content-Type': 'application/json',
    }

    console.log('Testing different API versions and endpoints...')

    const tests = [
      // Test different API versions
      { name: 'Collections 2024-10', url: `${shopifyUrl}/admin/api/2024-10/collections.json?limit=1` },
      { name: 'Collections 2024-07', url: `${shopifyUrl}/admin/api/2024-07/collections.json?limit=1` },
      { name: 'Collections 2024-04', url: `${shopifyUrl}/admin/api/2024-04/collections.json?limit=1` },
      { name: 'Collections 2024-01', url: `${shopifyUrl}/admin/api/2024-01/collections.json?limit=1` },
      { name: 'Collections 2023-10', url: `${shopifyUrl}/admin/api/2023-10/collections.json?limit=1` },
      
      // Test custom collections specifically
      { name: 'Custom Collections 2024-10', url: `${shopifyUrl}/admin/api/2024-10/custom_collections.json?limit=1` },
      { name: 'Smart Collections 2024-10', url: `${shopifyUrl}/admin/api/2024-10/smart_collections.json?limit=1` },
      
      // Test products endpoint for comparison
      { name: 'Products 2024-10', url: `${shopifyUrl}/admin/api/2024-10/products.json?limit=1` },
      
      // Test what API versions are available
      { name: 'API Versions', url: `${shopifyUrl}/admin/api.json` },
    ]

    const results = []

    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name}`)
        const response = await fetch(test.url, { headers })
        const data = await response.text()
        
        results.push({
          name: test.name,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          url: test.url,
          responseSize: data.length,
          hasData: data.includes('"collections"') || data.includes('"custom_collections"') || data.includes('"smart_collections"') || data.includes('"products"'),
          response: response.ok ? JSON.parse(data) : data
        })
        
        console.log(`${test.name}: ${response.status} ${response.statusText}`)
      } catch (error) {
        results.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          url: test.url
        })
        console.log(`${test.name}: ERROR - ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        shop_domain: settings.shop_domain,
        results: results,
        summary: {
          total_tests: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Debug test error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})