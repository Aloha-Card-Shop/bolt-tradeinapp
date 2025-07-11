
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { 
  extractCertificateData,
  determineGameType,
  determinePlayerName
} from "./utils.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for certificate lookups to reduce scraping frequency
const certCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours cache

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("PSA Scraper function called");
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
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
    
    if (!certNumber || typeof certNumber !== 'string') {
      console.log("Invalid certificate number:", certNumber);
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Certificate number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting to scrape PSA cert data for: ${certNumber}`);

    // Check cache first
    const cacheResult = checkCache(certNumber);
    if (cacheResult) {
      return cacheResult;
    }

    // Fetch certificate data
    return await fetchCertificateData(certNumber);
  } catch (error) {
    console.error("PSA scraper error:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message || "Failed to scrape certificate data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Check certificate cache and return cached result if available
function checkCache(certNumber: string): Response | null {
  const cacheKey = `cert-${certNumber}`;
  const cachedResult = certCache.get(cacheKey);
  
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`Cache hit for certificate: ${certNumber}`);
    return new Response(
      JSON.stringify({ data: cachedResult.data, fromCache: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return null;
}

// Fetch certificate data from PSA website
async function fetchCertificateData(certNumber: string): Promise<Response> {
  try {
    // Scrape the PSA certificate page
    const psaUrl = `https://www.psacard.com/cert/${certNumber}`;
    console.log(`Attempting to scrape URL: ${psaUrl}`);
    
    // Fetch the page content with improved headers
    const response = await fetch(psaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log(`Fetch response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Certificate not found: ${certNumber}`);
        return new Response(
          JSON.stringify({ error: "Not Found", message: "Certificate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.error(`HTTP error ${response.status}: ${response.statusText}`);
      // Return fallback data instead of throwing error
      console.log("Returning fallback data due to HTTP error");
      return createFallbackResponse(certNumber);
    }

    // Get the HTML content
    const html = await response.text();
    console.log(`Received HTML content length: ${html.length} characters`);
    
    if (html.length < 100) {
      console.log("HTML content too short, likely blocked or empty response");
      return createFallbackResponse(certNumber);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    if (!doc) {
      console.error("Failed to parse HTML document");
      return createFallbackResponse(certNumber);
    }

    console.log("HTML document parsed successfully");

    // Extract certificate data
    const certData = extractCertificateData(doc, certNumber);
    console.log("Certificate data extracted:", JSON.stringify(certData, null, 2));
    
    // Check if extraction was successful
    if (!certData || certData.cardName === "Certificate Data Extraction Failed") {
      console.log("Data extraction failed, returning fallback data");
      return createFallbackResponse(certNumber);
    }
    
    // Store in cache
    storeCertInCache(certNumber, certData);

    // Clean up old cache entries
    cleanupCache();

    return new Response(
      JSON.stringify({ data: certData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetchCertificateData:", error);
    console.log("Returning fallback data due to exception");
    return createFallbackResponse(certNumber);
  }
}

// Create fallback response when scraping fails
function createFallbackResponse(certNumber: string): Response {
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

// Store certificate data in cache
function storeCertInCache(certNumber: string, certData: any): void {
  const cacheKey = `cert-${certNumber}`;
  certCache.set(cacheKey, {
    data: certData,
    timestamp: Date.now()
  });
  console.log(`Stored certificate ${certNumber} in cache`);
}

// Clean up old cache entries
function cleanupCache(): void {
  const now = Date.now();
  let cleanedEntries = 0;
  
  for (const [key, value] of certCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      certCache.delete(key);
      cleanedEntries++;
    }
  }
  
  if (cleanedEntries > 0) {
    console.log(`Cleaned up ${cleanedEntries} expired cache entries`);
  }
}
