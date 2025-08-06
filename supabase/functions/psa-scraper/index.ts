
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.29.3';

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for certificate lookups to reduce scraping frequency
const certCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours cache

// Firecrawl configuration
const FIRECRAWL_API_KEY = 'fc-2dea0a85f9e84cb6ae0783193103e207';
let firecrawlApp: FirecrawlApp | null = null;

const getFirecrawlApp = (): FirecrawlApp => {
  if (!firecrawlApp) {
    firecrawlApp = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
  }
  return firecrawlApp;
};

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

// Fetch certificate data from PSA website using Firecrawl
async function fetchCertificateData(certNumber: string): Promise<Response> {
  try {
    const psaUrl = `https://www.psacard.com/cert/${certNumber}`;
    console.log(`Attempting to scrape URL with Firecrawl: ${psaUrl}`);
    
    const app = getFirecrawlApp();
    const scrapeResult = await app.scrapeUrl(psaUrl, {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      console.log(`Firecrawl scraping failed for certificate: ${certNumber}`);
      return createFallbackResponse(certNumber);
    }

    // Extract certificate data from scraped content
    const htmlContent = (scrapeResult as any).data?.html || '';
    const markdownContent = (scrapeResult as any).data?.markdown || '';
    
    console.log(`Firecrawl scraped content - HTML: ${htmlContent.length} chars, Markdown: ${markdownContent.length} chars`);
    
    if (htmlContent.length < 100 && markdownContent.length < 50) {
      console.log("Scraped content too short, likely blocked or empty response");
      return createFallbackResponse(certNumber);
    }

    // Extract certificate data from content
    const certData = extractCertificateDataFromContent(htmlContent, markdownContent, certNumber);
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

// Extract certificate data from HTML and markdown content
function extractCertificateDataFromContent(htmlContent: string, markdownContent: string, certNumber: string): any {
  try {
    // Try to extract from markdown first (cleaner format)
    let cardName = 'Unknown Card';
    let grade = '10';
    let year = undefined;
    let set = undefined;
    let cardNumber = undefined;
    let imageUrl = undefined;
    
    // Extract grade
    const gradeMatch = markdownContent.match(/Grade\s*:?\s*(\d+)/i) || htmlContent.match(/Grade\s*:?\s*(\d+)/i);
    if (gradeMatch) {
      grade = gradeMatch[1];
    }
    
    // Extract card name
    const cardNameMatch = markdownContent.match(/Card\s*:?\s*([^\n\r]+)/i) || 
                         htmlContent.match(/<title[^>]*>([^<]+)/i) ||
                         markdownContent.match(/\*\*([^*]+)\*\*/);
    if (cardNameMatch) {
      cardName = cardNameMatch[1].trim().replace(/PSA.*$/, '').trim();
    }
    
    // Extract year 
    const yearMatch = markdownContent.match(/(\d{4})/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    // Extract set information
    const setMatch = markdownContent.match(/Set\s*:?\s*([^\n\r]+)/i) ||
                     cardName.match(/(Base Set|Jungle|Fossil|Team Rocket|Gym|Neo|E-Card|EX|Diamond|Pearl|Platinum|HeartGold|SoulSilver|Black|White|XY|Sun|Moon|Sword|Shield)/i);
    if (setMatch) {
      set = setMatch[1].trim();
    }
    
    // Extract card number
    const numberMatch = markdownContent.match(/#(\d+)/);
    if (numberMatch) {
      cardNumber = numberMatch[1];
    }
    
    // Try to find image URL
    const imageMatch = htmlContent.match(/src="([^"]*(?:jpg|jpeg|png|gif)[^"]*)"/i);
    if (imageMatch) {
      imageUrl = imageMatch[1];
    }
    
    return {
      certNumber,
      cardName,
      grade,
      year,
      set,
      cardNumber,
      imageUrl,
      certificationDate: new Date().toISOString(),
      game: 'pokemon' // Default to pokemon
    };
    
  } catch (error) {
    console.error('Error extracting certificate data:', error);
    return {
      certNumber,
      cardName: "Certificate Data Extraction Failed",
      grade: "10",
      year: undefined,
      set: undefined,
      cardNumber: undefined,
      imageUrl: undefined,
      certificationDate: new Date().toISOString(),
      game: 'pokemon'
    };
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
