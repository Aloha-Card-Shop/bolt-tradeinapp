
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
    
    // Authenticate the request - using our more permissive cert lookup auth
    const { userId, error: authError } = await authenticateForCertLookup(req);
    if (authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: authError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("User authenticated:", userId);

    // Get the cert number from the request body
    const body = await req.json();
    const { certNumber } = body;
    
    if (!certNumber) {
      console.log("No certificate number provided");
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

    // Initialize Supabase client to get API key from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch the API key from the database using maybeSingle
    console.log("Fetching PSA_API_TOKEN from database");
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("key_value")
      .eq("key_name", "PSA_API_TOKEN")
      .eq("is_active", true)
      .maybeSingle();

    console.log("API key fetch result:", apiKeyData ? "Found key" : "No key found", apiKeyError ? `Error: ${apiKeyError.message}` : "No error");
    
    if (apiKeyError) {
      console.error("Error fetching API key:", apiKeyError);
      
      // If we're in development or testing mode, return mock data
      if (Deno.env.get("ENVIRONMENT") === "development" || Deno.env.get("ENVIRONMENT") === "test") {
        console.log("Using mock data for development/testing");
        const mockData = createMockCertData(certNumber);
        
        // Store in cache
        certCache.set(cacheKey, {
          data: mockData,
          timestamp: Date.now()
        });
        
        return new Response(
          JSON.stringify({ 
            data: mockData, 
            isMockData: true,
            message: "Using mock data as PSA_API_TOKEN is not configured or API key could not be retrieved from database"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // In production, return an error
      return new Response(
        JSON.stringify({ 
          error: "Server Error", 
          message: apiKeyError ? apiKeyError.message : "API key not configured or not found in database" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle case where no API key was found
    if (!apiKeyData) {
      console.error("PSA_API_TOKEN not found in database");
      
      // If we're in development or testing mode, return mock data
      if (Deno.env.get("ENVIRONMENT") === "development" || Deno.env.get("ENVIRONMENT") === "test") {
        console.log("Using mock data for development/testing");
        const mockData = createMockCertData(certNumber);
        
        // Store in cache
        certCache.set(cacheKey, {
          data: mockData,
          timestamp: Date.now()
        });
        
        return new Response(
          JSON.stringify({ 
            data: mockData, 
            isMockData: true,
            message: "Using mock data as PSA_API_TOKEN not found in database"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // In production, return an error
      return new Response(
        JSON.stringify({ 
          error: "Configuration Error", 
          message: "PSA API key not found in database. Please configure it in API Settings." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = apiKeyData.key_value;
    
    if (!apiKey || apiKey.trim() === "") {
      console.error("PSA_API_TOKEN is empty in database");
      
      // If we're in development or testing mode, return mock data
      if (Deno.env.get("ENVIRONMENT") === "development" || Deno.env.get("ENVIRONMENT") === "test") {
        console.log("Using mock data for development/testing");
        const mockData = createMockCertData(certNumber);
        
        // Store in cache
        certCache.set(cacheKey, {
          data: mockData,
          timestamp: Date.now()
        });
        
        return new Response(
          JSON.stringify({ 
            data: mockData, 
            isMockData: true,
            message: "Using mock data as PSA_API_TOKEN is not configured"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // In production, return an error
      return new Response(
        JSON.stringify({ error: "Server Error", message: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Make the request to the CORRECT PSA API URL
    const apiUrl = `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certNumber)}`;
    console.log(`Making request to PSA API: ${apiUrl}`);

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
      
      if (certResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "Not Found", message: "Certificate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
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
    console.error("Error in cert-lookup function:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

// Generate mock certificate data for development and testing environments
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
