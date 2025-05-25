
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
  isOutlier?: boolean;
}

interface EbayPriceResponse {
  average_price: number;
  search_url: string;
  sold_items: EbaySoldItem[];
  query: string;
  sales_count: number;
  price_range: {
    min: number;
    max: number;
  };
  outliers_removed: number;
  calculation_method: string;
  error?: string;
}

// Helper function to compute clean average and flag outliers
function computeCleanAverage(items: EbaySoldItem[]): { average: number; outliersRemoved: number; itemsWithFlags: EbaySoldItem[] } {
  if (items.length === 0) return { average: 0, outliersRemoved: 0, itemsWithFlags: [] };
  
  const prices = items.map(item => item.price);
  
  if (items.length <= 2) {
    // For small datasets, don't remove outliers
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const itemsWithFlags = items.map(item => ({ ...item, isOutlier: false }));
    return { 
      average: +average.toFixed(2),
      outliersRemoved: 0,
      itemsWithFlags
    };
  }
  
  // Sort prices to determine outlier thresholds
  const sorted = [...prices].sort((a, b) => a - b);
  const trim = Math.floor(prices.length * 0.3);
  const minThreshold = sorted[trim];
  const maxThreshold = sorted[sorted.length - 1 - trim];
  
  // Flag outliers and calculate average from non-outliers
  let sum = 0;
  let countNonOutliers = 0;
  let outliersRemoved = 0;
  
  const itemsWithFlags = items.map(item => {
    const isOutlier = item.price < minThreshold || item.price > maxThreshold;
    
    if (!isOutlier) {
      sum += item.price;
      countNonOutliers++;
    } else {
      outliersRemoved++;
    }
    
    return { ...item, isOutlier };
  });
  
  const average = countNonOutliers > 0 ? +(sum / countNonOutliers).toFixed(2) : 0;
  
  return { average, outliersRemoved, itemsWithFlags };
}

// Get eBay OAuth2 token using the centralized token service
async function getEbayToken(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable not configured");
  }
  
  const tokenUrl = `${supabaseUrl}/functions/v1/get-ebay-token`;
  
  const response = await fetch(tokenUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
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

// Search eBay for sold PSA cards (limited to 5 most recent)
async function searchEbaySoldListings(query: string, token: string): Promise<EbaySoldItem[]> {
  const searchUrl = "https://api.ebay.com/buy/browse/v1/item_summary/search";
  
  const params = new URLSearchParams({
    q: query,
    filter: "buyingOptions:{AUCTION|FIXED_PRICE},soldItemsOnly:true,conditions:{1000}",
    limit: "5",
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

    console.log(`Searching eBay for last 5 recent sales: ${game} ${card_name} ${card_number} PSA ${psa_grade}`);

    // Get eBay access token using centralized service
    const token = await getEbayToken();

    // Build search query
    const query = buildSearchQuery(game, card_name, card_number, psa_grade);
    
    // Search eBay for sold listings (limited to 5 most recent)
    const rawSoldItems = await searchEbaySoldListings(query, token);

    // Process items to flag outliers and calculate clean average
    const { average: averagePrice, outliersRemoved, itemsWithFlags } = computeCleanAverage(rawSoldItems);
    
    // Calculate price range from all items
    const allPrices = itemsWithFlags.map(item => item.price);
    const priceRange = allPrices.length > 0 ? {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices)
    } : { min: 0, max: 0 };

    // Build eBay search URL for user reference
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1`;

    // Prepare response with enhanced data
    const response: EbayPriceResponse = {
      average_price: averagePrice,
      search_url: searchUrl,
      sold_items: itemsWithFlags,
      query: query,
      sales_count: itemsWithFlags.filter(item => !item.isOutlier).length, // Count only non-outliers for sales count
      price_range: priceRange,
      outliers_removed: outliersRemoved,
      calculation_method: itemsWithFlags.length <= 2 ? "simple_average" : "outlier_trimmed_average"
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
            sales_count: response.sales_count,
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
      sales_count: 0,
      price_range: { min: 0, max: 0 },
      outliers_removed: 0,
      calculation_method: "error"
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
