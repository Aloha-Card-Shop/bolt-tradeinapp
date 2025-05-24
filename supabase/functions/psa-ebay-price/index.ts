
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EbaySearchRequest {
  game: string;
  card_name: string;
  card_number?: string;
  psa_grade: string;
}

interface EbaySoldItem {
  title: string;
  price: number;
  url: string;
  currency?: string;
}

interface EbayPriceResponse {
  average_price: number;
  search_url: string;
  sold_items: EbaySoldItem[];
  query: string;
  sales_count: number;
  error?: string;
}

// Helper function to compute clean average by trimming outliers
function computeCleanAverage(prices: number[]): number {
  if (prices.length === 0) return 0;
  if (prices.length <= 2) return prices.reduce((a, b) => a + b, 0) / prices.length;
  
  const sorted = prices.sort((a, b) => a - b);
  const trim = Math.floor(prices.length * 0.3);
  const trimmed = sorted.slice(trim, prices.length - trim);
  
  if (trimmed.length === 0) return sorted.reduce((a, b) => a + b, 0) / sorted.length;
  
  return +(trimmed.reduce((a, b) => a + b, 0) / trimmed.length).toFixed(2);
}

// Get eBay OAuth2 token
async function getEbayToken(): Promise<string> {
  const clientId = Deno.env.get("EBAY_CLIENT_ID");
  const clientSecret = Deno.env.get("EBAY_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("eBay API credentials not configured");
  }
  
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get eBay token: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Build search query for different card games
function buildSearchQuery(game: string, cardName: string, cardNumber: string, psaGrade: string): string {
  const components = [game, cardName];
  
  if (cardNumber) {
    components.push(cardNumber);
  }
  
  components.push(`PSA ${psaGrade}`);
  
  return components.join(' ').trim();
}

// Search eBay for sold PSA cards
async function searchEbaySoldListings(query: string, token: string): Promise<EbaySoldItem[]> {
  const searchUrl = "https://api.ebay.com/buy/browse/v1/item_summary/search";
  
  const params = new URLSearchParams({
    q: query,
    filter: "buyingOptions:{AUCTION|FIXED_PRICE},soldItemsOnly:true,conditions:{1000}",
    limit: "50",
    sort: "endTimeNewest"
  });
  
  const response = await fetch(`${searchUrl}?${params}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
    }
  });
  
  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.itemSummaries || data.itemSummaries.length === 0) {
    return [];
  }
  
  return data.itemSummaries
    .filter((item: any) => item.price && item.price.value)
    .map((item: any) => ({
      title: item.title || "Unknown Title",
      price: parseFloat(item.price.value),
      url: item.itemWebUrl || "",
      currency: item.price.currency || "USD"
    }))
    .filter((item: EbaySoldItem) => item.price > 0 && item.currency === "USD");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const requestData = await req.json() as EbaySearchRequest;
    const { game, card_name, card_number = "", psa_grade } = requestData;

    // Validate required fields
    if (!game || !card_name || !psa_grade) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: game, card_name, and psa_grade are required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching eBay for: ${game} ${card_name} ${card_number} PSA ${psa_grade}`);

    // Get eBay access token
    const token = await getEbayToken();

    // Build search query
    const query = buildSearchQuery(game, card_name, card_number, psa_grade);
    
    // Search eBay for sold listings
    const soldItems = await searchEbaySoldListings(query, token);

    // Extract prices and calculate clean average
    const prices = soldItems.map(item => item.price);
    const averagePrice = computeCleanAverage(prices);

    // Build eBay search URL for user reference
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1`;

    // Prepare response
    const response: EbayPriceResponse = {
      average_price: averagePrice,
      search_url: searchUrl,
      sold_items: soldItems,
      query: query,
      sales_count: soldItems.length
    };

    // Optional: Log search to Supabase (if table exists)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from("psa_search_log")
          .insert({
            game,
            card_name,
            card_number,
            psa_grade,
            average_price: averagePrice,
            created_at: new Date().toISOString()
          });
      }
    } catch (logError) {
      console.log("Failed to log search (table may not exist):", logError);
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in psa-ebay-price function:", error);
    
    const errorResponse: EbayPriceResponse = {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      average_price: 0,
      search_url: "",
      sold_items: [],
      query: "",
      sales_count: 0
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
