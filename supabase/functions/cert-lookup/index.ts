import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for certificate lookups to reduce API calls
const certCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// Authentication function specifically for cert lookups
// This is less restrictive than authenticateAdmin
async function authenticateForCertLookup(req: Request) {
  try {
    // Extract authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
      return { userId: '', role: '', error: 'Missing authorization header' };
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    
    // Create client for authentication check
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log("Authentication error:", authError?.message || "Invalid session");
      return { userId: '', role: '', error: authError?.message || 'Invalid session' };
    }

    console.log("User authenticated successfully:", user.id);
    
    // For cert lookup, we allow any authenticated user
    return { userId: user.id, role: 'user', error: undefined };
  } catch (error) {
    console.error('Certificate lookup authentication error:', error);
    return { userId: '', role: '', error: `Authentication failed: ${error.message || 'Unknown error'}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Certificate lookup function called");
    console.log("Request method:", req.method);

    // Get the cert number from the request body
    console.log("Parsing request body...");
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { certNumber } = body;
    console.log("Received certificate number:", certNumber);
    
    if (!certNumber) {
      console.log("No certificate number provided in body");
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Certificate number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up certificate: ${certNumber}`);

    // Check if we have a cached response
    const cacheKey = `cert-${certNumber}`;
    const cachedResponse = certCache.get(cacheKey);
    if (cachedResponse && cachedResponse.timestamp > Date.now() - CACHE_TTL) {
      console.log(`Cache hit for certificate: ${certNumber}`);
      return new Response(
        JSON.stringify({ data: cachedResponse.data, fromCache: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First try PSA API with the configured token
    
    // Try to get the PSA API token from Edge Function secrets first
    let apiKey = Deno.env.get("PSA_API_TOKEN");
    console.log("Checking for PSA_API_TOKEN in Edge Function secrets:", apiKey ? "Found" : "Not found");
    
    // If not found in secrets, try to get from database
    if (!apiKey) {
      console.log("PSA_API_TOKEN not found in secrets, fetching from database...");
      
      // Initialize Supabase client with service role key for database access
      const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
      
      if (!supabaseServiceKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is not configured in secrets");
        console.log("Falling back to web scraper...");
        return await callPsaScraper(certNumber);
      }
      
      // Create client with service role for admin access to api_keys table
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Fetch the API key from the database
      console.log("Fetching PSA_API_TOKEN from database using service role");
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from("api_keys")
        .select("key_value")
        .eq("key_name", "PSA_API_TOKEN")
        .eq("is_active", true)
        .maybeSingle();
      
      console.log("API key fetch result:", 
        apiKeyData ? "Found key" : "No key found", 
        apiKeyError ? `Error: ${apiKeyError.message}` : "No error"
      );
      
      if (apiKeyError) {
        console.error("Error fetching API key:", apiKeyError);
        console.log("Falling back to web scraper due to database error...");
        return await callPsaScraper(certNumber);
      }

      // Handle case where no API key was found
      if (!apiKeyData) {
        console.error("PSA_API_TOKEN not found in database");
        console.log("Falling back to web scraper due to missing API key...");
        return await callPsaScraper(certNumber);
      }

      apiKey = apiKeyData.key_value;
    }
    
    if (!apiKey || apiKey.trim() === "") {
      console.error("PSA API token is empty");
      console.log("Falling back to web scraper due to empty API key...");
      return await callPsaScraper(certNumber);
    }

    // Make the request to the PSA API
    const apiUrl = `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certNumber)}`;
    console.log(`Making request to PSA API: ${apiUrl}`);

    try {
      const certResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!certResponse.ok) {
        const errorText = await certResponse.text();
        console.error(`API error (${certResponse.status}):`, errorText);
        
        // If API returns rate limit error (429) or other error, fall back to scraper
        if (certResponse.status === 429 || certResponse.status >= 500) {
          console.log("API rate limited or error, falling back to web scraper...");
          return await callPsaScraper(certNumber);
        }
        
        if (certResponse.status === 404) {
          return new Response(
            JSON.stringify({ error: "Not Found", message: "Certificate not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Other API errors
        return new Response(
          JSON.stringify({ error: "API Error", message: `Error from certification API: ${certResponse.status} - ${errorText}` }),
          { status: certResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the response from PSA's API
      const psaResponse = await certResponse.json();
      console.log("Received PSA certification data:", JSON.stringify(psaResponse).substring(0, 200) + "...");
      
      // Extract relevant data from PSA API response format
      const psaCert = psaResponse.PSACert || {};
      
      // Process the data to format it for our needs
      const processedData = {
        certNumber: psaCert.CertNumber || certNumber,
        cardName: psaCert.Subject || psaCert.Brand || "Unknown Card",
        grade: psaCert.CardGrade || "Unknown",
        year: psaCert.Year || "",
        set: psaCert.Brand || "",
        cardNumber: psaCert.CardNumber || "",
        playerName: psaCert.Subject || "",
        imageUrl: null, // PSA API doesn't provide image URLs
        certificationDate: null,
        game: mapCardGame(psaCert.Category || ""), 
      };

      // Store in cache
      certCache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      cleanupCache();

      console.log("Returning processed certification data");
      return new Response(
        JSON.stringify({ data: processedData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error calling PSA API:", error);
      console.log("API call failed, falling back to web scraper...");
      return await callPsaScraper(certNumber);
    }
  } catch (error) {
    console.error("Error in cert-lookup function:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to call the PSA scraper edge function
async function callPsaScraper(certNumber: string) {
  try {
    console.log("Calling PSA scraper function for certificate:", certNumber);
    
    // Get Supabase URL and service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    
    // Call our PSA scraper function
    const scraperUrl = `${supabaseUrl}/functions/v1/psa-scraper`;
    
    console.log(`Calling scraper at: ${scraperUrl}`);
    
    const response = await fetch(scraperUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ certNumber })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scraper error (${response.status}):`, errorText);
      
      // Return fallback data instead of error
      console.log("Scraper failed, returning fallback data");
      return createFallbackCertResponse(certNumber);
    }
    
    // Get response from scraper
    const scraperResponse = await response.json();
    console.log("Scraper returned data successfully");
    
    // Update cache with scraped data
    if (scraperResponse.data) {
      const cacheKey = `cert-${certNumber}`;
      certCache.set(cacheKey, {
        data: scraperResponse.data,
        timestamp: Date.now()
      });
    }
    
    // Return the scraper response
    return new Response(
      JSON.stringify({ 
        data: scraperResponse.data, 
        source: "scraper" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in PSA scraper fallback:", error);
    console.log("All scraper methods failed, returning fallback data");
    return createFallbackCertResponse(certNumber);
  }
}

// Helper to map certification categories to our game types
function mapCardGame(category: string): string {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("pokemon")) return "pokemon";
  if (lowerCategory.includes("magic")) return "magic";
  if (lowerCategory.includes("yugioh")) return "yugioh";
  if (lowerCategory.includes("baseball") || 
      lowerCategory.includes("football") || 
      lowerCategory.includes("basketball") || 
      lowerCategory.includes("hockey")) return "sports";
  return "other";
}

// Clean up old cache entries
function cleanupCache() {
  const now = Date.now();
  certCache.forEach((value, key) => {
    if (value.timestamp < now - CACHE_TTL) {
      certCache.delete(key);
    }
  });
}

// Create fallback response when all methods fail
function createFallbackCertResponse(certNumber: string): Response {
  const fallbackData = {
    certNumber,
    cardName: "Test Certificate Data",
    grade: "10",
    year: "2023",
    set: "Test Set",
    cardNumber: "1",
    playerName: "Test Player",
    imageUrl: null,
    certificationDate: new Date().toISOString(),
    game: "pokemon",
    debug: {
      message: "This is fallback data for testing purposes",
      timestamp: new Date().toISOString(),
      originalCertNumber: certNumber
    }
  };
  
  console.log("Returning fallback certificate data:", JSON.stringify(fallbackData, null, 2));
  
  return new Response(
    JSON.stringify({ data: fallbackData, isFallback: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Generate mock certificate data for development and testing environments (keep for consistency)
function createMockCertData(certNumber: string) {
  // Create deterministic but "random-looking" data based on the cert number
  const lastDigit = parseInt(certNumber.slice(-1));
  const secondLastDigit = parseInt(certNumber.slice(-2, -1));
  
  const games = ["pokemon", "magic", "yugioh", "sports", "other"];
  const gameIndex = lastDigit % games.length;
  
  const grades = ["10", "9.5", "9", "8.5", "8", "7"];
  const gradeIndex = lastDigit % grades.length;
  
  let cardName, setName;
  
  // Generate game-specific mock data
  switch (games[gameIndex]) {
    case "pokemon":
      const pokemonCards = ["Charizard", "Pikachu", "Blastoise", "Mewtwo", "Mew", "Lugia"];
      const pokemonSets = ["Base Set", "Jungle", "Fossil", "Team Rocket", "Gym Heroes"];
      cardName = pokemonCards[secondLastDigit % pokemonCards.length];
      setName = pokemonSets[secondLastDigit % pokemonSets.length];
      break;
    case "magic":
      const magicCards = ["Black Lotus", "Mox Ruby", "Time Walk", "Ancestral Recall", "Underground Sea"];
      const magicSets = ["Alpha", "Beta", "Unlimited", "Revised", "Legends"];
      cardName = magicCards[secondLastDigit % magicCards.length];
      setName = magicSets[secondLastDigit % magicSets.length];
      break;
    case "yugioh":
      const yugiohCards = ["Dark Magician", "Blue-Eyes White Dragon", "Exodia", "Red-Eyes Black Dragon"];
      const yugiohSets = ["Legend of Blue Eyes", "Metal Raiders", "Spell Ruler", "Dark Crisis"];
      cardName = yugiohCards[secondLastDigit % yugiohCards.length];
      setName = yugiohSets[secondLastDigit % yugiohSets.length];
      break;
    case "sports":
      const sportsCards = ["Michael Jordan", "LeBron James", "Wayne Gretzky", "Babe Ruth", "Tom Brady"];
      const sportsSets = ["Topps", "Upper Deck", "Fleer", "Donruss", "Panini Prizm"];
      cardName = sportsCards[secondLastDigit % sportsCards.length];
      setName = sportsSets[secondLastDigit % sportsSets.length];
      break;
    default:
      cardName = "Collectible Card";
      setName = "Limited Edition";
  }
  
  return {
    certNumber: certNumber,
    cardName: cardName,
    grade: grades[gradeIndex],
    year: `${1990 + (lastDigit * 2)}`,
    set: setName,
    cardNumber: `${lastDigit * 10 + secondLastDigit}/100`,
    playerName: games[gameIndex] === "sports" ? cardName : null,
    imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(cardName)}`,
    certificationDate: new Date(Date.now() - (lastDigit * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    game: games[gameIndex],
  };
}
