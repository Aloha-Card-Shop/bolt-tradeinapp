import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyTokenInfo {
  scopes: string[]
  associated_user_scope?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Testing Shopify connection and permissions...')

    // Get Shopify settings
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_settings')
      .select('shop_domain, access_token, is_active')
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

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ 
          error: 'No active Shopify settings found. Please configure Shopify integration first.',
          settingsError 
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { shop_domain, access_token } = settings
    const shopifyUrl = `https://${shop_domain}`
    
    const headers = {
      'X-Shopify-Access-Token': access_token,
      'Content-Type': 'application/json',
    }

    // Test 1: Basic shop info
    console.log('Testing basic shop connection...')
    const shopResponse = await fetch(`${shopifyUrl}/admin/api/2024-10/shop.json`, { headers })
    
    if (!shopResponse.ok) {
      const errorText = await shopResponse.text()
      console.error('Shop connection failed:', {
        status: shopResponse.status,
        statusText: shopResponse.statusText,
        body: errorText
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Shopify shop',
          status: shopResponse.status,
          details: errorText,
          suggestion: shopResponse.status === 401 ? 'Invalid access token - please regenerate' : 
                     shopResponse.status === 403 ? 'Access token lacks basic permissions' :
                     shopResponse.status === 404 ? 'Invalid shop domain' :
                     'Unknown connection error'
        }),
        { status: shopResponse.status, headers: corsHeaders }
      )
    }

    const shopInfo = await shopResponse.json()
    console.log('Shop connection successful:', shopInfo.shop?.name)

    // Test 2: Check token permissions using GraphQL Admin API
    console.log('Testing token permissions...')
    const permissionsQuery = `
      query {
        app {
          installation {
            accessScopes {
              handle
            }
          }
        }
      }
    `

    const graphqlResponse = await fetch(`${shopifyUrl}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: permissionsQuery })
    })

    let tokenPermissions = []
    if (graphqlResponse.ok) {
      const graphqlData = await graphqlResponse.json()
      if (graphqlData.data?.app?.installation?.accessScopes) {
        tokenPermissions = graphqlData.data.app.installation.accessScopes.map((scope: any) => scope.handle)
      }
    }

    // Test 3: Try to access collections endpoint
    console.log('Testing collections access...')
    const collectionsResponse = await fetch(`${shopifyUrl}/admin/api/2024-10/collections.json?limit=1`, { headers })
    
    const collectionsAccessible = collectionsResponse.ok
    let collectionsError = null
    
    if (!collectionsResponse.ok) {
      collectionsError = await collectionsResponse.text()
      console.log('Collections access failed:', {
        status: collectionsResponse.status,
        error: collectionsError
      })
    }

    // Test 4: Try to access products endpoint
    console.log('Testing products access...')
    const productsResponse = await fetch(`${shopifyUrl}/admin/api/2024-10/products.json?limit=1`, { headers })
    
    const productsAccessible = productsResponse.ok
    let productsError = null
    
    if (!productsResponse.ok) {
      productsError = await productsResponse.text()
      console.log('Products access failed:', {
        status: productsResponse.status,
        error: productsError
      })
    }

    // Required permissions for collections sync
    const requiredPermissions = ['read_products', 'read_collections']
    const optionalPermissions = ['write_products', 'write_inventory']
    
    const hasRequiredPermissions = requiredPermissions.every(perm => 
      tokenPermissions.includes(perm)
    )

    const missingRequired = requiredPermissions.filter(perm => 
      !tokenPermissions.includes(perm)
    )

    const hasOptionalPermissions = optionalPermissions.filter(perm => 
      tokenPermissions.includes(perm)
    )

    return new Response(
      JSON.stringify({
        success: true,
        shop: {
          name: shopInfo.shop?.name,
          domain: shopInfo.shop?.domain,
          plan: shopInfo.shop?.plan_name
        },
        permissions: {
          detected: tokenPermissions,
          required: requiredPermissions,
          optional: optionalPermissions,
          missing_required: missingRequired,
          has_optional: hasOptionalPermissions,
          has_all_required: hasRequiredPermissions
        },
        endpoint_tests: {
          shop_info: true,
          collections: {
            accessible: collectionsAccessible,
            error: collectionsError,
            status: collectionsResponse.status
          },
          products: {
            accessible: productsAccessible,
            error: productsError,
            status: productsResponse.status
          }
        },
        recommendations: hasRequiredPermissions ? 
          ['Your token has all required permissions. Collections sync should work.'] :
          [
            'Your access token is missing required permissions:',
            ...missingRequired.map(perm => `- ${perm}`),
            '',
            'To fix this:',
            '1. Go to your Shopify Admin → Apps → Private apps',
            '2. Click on your private app',
            '3. Update the permissions to include read_products and read_collections',
            '4. Save and regenerate the access token',
            '5. Update the token in your Shopify settings'
          ]
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Connection test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to test Shopify connection',
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})