
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { chromium } from "https://deno.land/x/playwright@v1.35.0/mod.ts";

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
    const cacheKey = `cert-${certNumber}`;
    const cachedResult = certCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Cache hit for certificate: ${certNumber}`);
      return new Response(
        JSON.stringify({ data: cachedResult.data, fromCache: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scrape the PSA certificate page
    const psaUrl = `https://www.psacard.com/cert/${certNumber}`;
    console.log(`Scraping URL: ${psaUrl}`);
    
    // Launch browser
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      const page = await context.newPage();

      // Navigate to PSA certificate page
      await page.goto(psaUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Check if certificate is found
      const notFoundSelector = 'text=Certificate not found';
      const notFound = await page.$(notFoundSelector);
      
      if (notFound) {
        console.log(`Certificate not found: ${certNumber}`);
        return new Response(
          JSON.stringify({ error: "Not Found", message: "Certificate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract certificate data
      const html = await page.content();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      if (!doc) {
        throw new Error("Failed to parse HTML document");
      }

      // Extract data from the DOM
      const certData = extractCertificateData(doc, certNumber);
      
      // Store in cache
      certCache.set(cacheKey, {
        data: certData,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      cleanupCache();

      return new Response(
        JSON.stringify({ data: certData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("PSA scraper error:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message || "Failed to scrape certificate data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Extract certificate data from the DOM
function extractCertificateData(doc: Document, certNumber: string): any {
  try {
    // Card name is usually in a heading element
    let cardName = "";
    const cardNameElement = doc.querySelector(".cert-details h1, .cert-details h2, .cert-item-details h1");
    if (cardNameElement) {
      cardName = cardNameElement.textContent.trim();
    }

    // Grade is typically displayed prominently
    let grade = "";
    const gradeElement = doc.querySelector(".cert-grade, .grade-value");
    if (gradeElement) {
      grade = gradeElement.textContent.trim().replace("GRADE:", "").trim();
    }

    // Set information
    let set = "";
    const setElement = doc.querySelector(".cert-set, .set-name");
    if (setElement) {
      set = setElement.textContent.trim();
    }

    // Year information
    let year = "";
    const yearElement = doc.querySelector(".cert-year, .year-value");
    if (yearElement) {
      year = yearElement.textContent.trim();
    }

    // Card number information
    let cardNumber = "";
    const cardNumberElement = doc.querySelector(".cert-number, .card-number");
    if (cardNumberElement) {
      cardNumber = cardNumberElement.textContent.trim().replace("#", "").trim();
    }

    // Get image if available
    let imageUrl = null;
    const imageElement = doc.querySelector(".cert-image img, .card-image img");
    if (imageElement) {
      imageUrl = imageElement.getAttribute("src");
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `https://www.psacard.com${imageUrl}`;
      }
    }

    // Determine game type based on the certificate details
    let game = determineGameType(cardName, set);

    // Format certification date
    const certDate = doc.querySelector(".cert-date");
    let certificationDate = null;
    if (certDate) {
      certificationDate = certDate.textContent.trim();
      // Try to format to ISO string if possible
      try {
        const dateObj = new Date(certificationDate);
        if (!isNaN(dateObj.getTime())) {
          certificationDate = dateObj.toISOString();
        }
      } catch (e) {
        console.log("Failed to parse date:", e);
      }
    }

    // Construct the certificate data in the format expected by our frontend
    return {
      certNumber: certNumber,
      cardName: cardName || "Unknown Card",
      grade: grade || "Unknown",
      year: year || "",
      set: set || "",
      cardNumber: cardNumber || "",
      playerName: determinePlayerName(cardName),
      imageUrl,
      certificationDate,
      game
    };
  } catch (error) {
    console.error("Error extracting cert data:", error);
    // Return minimal data if extraction fails
    return {
      certNumber,
      cardName: "Certificate Data Extraction Failed",
      grade: "Unknown",
      game: "other"
    };
  }
}

// Helper function to determine game type from card details
function determineGameType(cardName: string, set: string): string {
  const lowerCardName = (cardName || "").toLowerCase();
  const lowerSet = (set || "").toLowerCase();
  
  // Check for Pokemon
  if (lowerCardName.includes("pokemon") || 
      lowerSet.includes("pokemon") || 
      lowerCardName.includes("pikachu") ||
      lowerCardName.includes("charizard")) {
    return "pokemon";
  }
  
  // Check for Magic: The Gathering
  if (lowerCardName.includes("magic") || 
      lowerSet.includes("magic") ||
      lowerSet.includes("mtg") ||
      lowerCardName.includes("gathering")) {
    return "magic";
  }
  
  // Check for Yu-Gi-Oh
  if (lowerCardName.includes("yugioh") || 
      lowerCardName.includes("yu-gi-oh") || 
      lowerSet.includes("yugioh") ||
      lowerSet.includes("yu-gi-oh")) {
    return "yugioh";
  }
  
  // Check for sports cards
  if (lowerCardName.includes("topps") || 
      lowerCardName.includes("upper deck") ||
      lowerCardName.includes("fleer") ||
      lowerCardName.includes("panini") ||
      lowerCardName.includes("bowman") ||
      lowerSet.includes("baseball") ||
      lowerSet.includes("football") ||
      lowerSet.includes("basketball") ||
      lowerSet.includes("hockey")) {
    return "sports";
  }
  
  // Default
  return "other";
}

// Extract player name from card name for sports cards
function determinePlayerName(cardName: string): string {
  // This is a simplistic approach, would need refinement for production
  if (!cardName) return "";
  
  // For sports cards, often the first part is the player name
  const parts = cardName.split(' ');
  if (parts.length >= 2) {
    // Very basic heuristic - take first two parts as name
    // A more sophisticated approach would be needed for production
    return `${parts[0]} ${parts[1]}`;
  }
  
  return "";
}

// Clean up old cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of certCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      certCache.delete(key);
    }
  }
}
