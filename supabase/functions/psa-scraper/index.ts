
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
    const { certNumber } = await req.json();
    
    if (!certNumber || typeof certNumber !== 'string') {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Certificate number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping PSA cert data for: ${certNumber}`);

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
  // Scrape the PSA certificate page
  const psaUrl = `https://www.psacard.com/cert/${certNumber}`;
  console.log(`Scraping URL: ${psaUrl}`);
  
  // Fetch the page content
  const response = await fetch(psaUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.log(`Certificate not found: ${certNumber}`);
      return new Response(
        JSON.stringify({ error: "Not Found", message: "Certificate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    throw new Error(`Failed to fetch PSA certificate page: ${response.status} ${response.statusText}`);
  }

  // Get the HTML content
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  if (!doc) {
    throw new Error("Failed to parse HTML document");
  }

  // Extract certificate data
  const certData = extractCertificateData(doc, certNumber);
  
  // Store in cache
  storeCertInCache(certNumber, certData);

  // Clean up old cache entries
  cleanupCache();

  return new Response(
    JSON.stringify({ data: certData }),
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
