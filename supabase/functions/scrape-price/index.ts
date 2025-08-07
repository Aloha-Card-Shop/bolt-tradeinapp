
import { DOMParser } from "npm:linkedom@0.16.11";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Add caching mechanism with 12-hour TTL
const priceCache = new Map<string, { price: string; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Concurrency control settings - Increased from 10 to 20
const MAX_CONCURRENT_REQUESTS = 20;
const REQUEST_DELAY_MS = 800; // slightly reduced from 1000ms to 800ms
let currentConcurrentRequests = 0;
const requestQueue: Array<() => Promise<void>> = [];

interface ScrapeRequest {
  url: string;
  productId: string;
  condition: string;
  language: string;
  isFirstEdition?: boolean;
  isHolo?: boolean;
}

async function processQueue() {
  if (requestQueue.length === 0 || currentConcurrentRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }

  // Process next request if we have capacity
  const nextRequest = requestQueue.shift();
  if (nextRequest) {
    currentConcurrentRequests++;
    
    try {
      await nextRequest();
    } finally {
      currentConcurrentRequests--;
      
      // Delay slightly before processing next request to avoid hammering the server
      setTimeout(() => {
        processQueue();
      }, REQUEST_DELAY_MS);
    }
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

Deno.serve(async (req) => {
  console.log('[Scraper] Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log('[Scraper] Handling CORS preflight');
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (req.method !== "POST") {
    console.log('[Scraper] Invalid method:', req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  try {
    const requestData = await req.json() as ScrapeRequest;
    console.log('[Scraper] Processing request:', {
      url: requestData.url,
      productId: requestData.productId,
      condition: requestData.condition,
      language: requestData.language,
      isFirstEdition: requestData.isFirstEdition,
      isHolo: requestData.isHolo
    });
    
    const { url, productId } = requestData;
    
    if (!url || !productId || !url.includes("tcgplayer.com/product")) {
      console.error('[Scraper] Invalid parameters:', { url, productId });
      throw new Error("Invalid request parameters");
    }

    // Check cache first
    const cacheKey = url;
    const cachedData = priceCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('[Scraper] Returning cached price data for:', url);
      return new Response(
        JSON.stringify({ 
          price: cachedData.price,
          productId,
          cached: true
        }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // If we've reached the concurrency limit, add this request to the queue
    if (currentConcurrentRequests >= MAX_CONCURRENT_REQUESTS) {
      console.log(`[Scraper] Max concurrency reached (${MAX_CONCURRENT_REQUESTS}), queuing request for ${url}`);
      
      // Create a promise for this queued request
      const responsePromise = new Promise<Response>((resolve) => {
        requestQueue.push(async () => {
          try {
            const response = await processScrapeRequest(url, productId);
            resolve(response);
          } catch (error) {
            console.error('[Scraper] Error in queued request:', error);
            resolve(new Response(
              JSON.stringify({ 
                error: error instanceof Error ? error.message : "Unknown error", 
                details: "Failed to scrape price data" 
              }), 
              {
                status: 500,
                headers: { 
                  "Content-Type": "application/json",
                  ...corsHeaders
                }
              }
            ));
          }
        });
      });
      
      // Trigger queue processing
      processQueue();
      
      return responsePromise;
    } else {
      currentConcurrentRequests++;
      try {
        return await processScrapeRequest(url, productId);
      } finally {
        currentConcurrentRequests--;
        // Process any queued requests
        processQueue();
      }
    }
  } catch (err) {
    console.error('[Scraper] Error:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : "Unknown error",
      details: "Failed to scrape price data"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

async function processScrapeRequest(url: string, productId: string): Promise<Response> {
  console.log('[Scraper] Fetching TCGPlayer page:', url);
  try {
    const res = await fetchWithTimeout(
      url, 
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      },
      30000 // 30 second timeout
    );

    if (!res.ok) {
      console.error('[Scraper] Failed to fetch page:', {
        status: res.status,
        statusText: res.statusText
      });
      throw new Error(`Failed to fetch TCGPlayer page: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    console.log('[Scraper] Received HTML response:', {
      length: html.length,
      snippet: html.substring(0, 200) + '...'
    });

    const doc = new DOMParser().parseFromString(html, "text/html");
    
    console.log('[Scraper] Parsing HTML content for price extraction');
    
    // Enhanced selectors specifically for TCGPlayer's current structure
    const priceSelectors = [
      // Main price display selectors
      ".spotlight__price",
      "[data-testid='price-guide-price']",
      ".price-guide__spotlight-price",
      ".price-points__point-value",
      ".inventory__price",
      ".seller-listing__price",
      ".product-details .price",
      // Broader selectors for any price element
      "[class*='price']",
      "[data-testid*='price']",
      ".tcg-price",
      ".market-price",
      ".listing-price",
      // Even broader fallbacks
      "*[class*='Price']",
      "*[class*='PRICE']"
    ];
    
    let price: string | undefined;
    let usedSelector: string | undefined;
    
    // Try DOM selectors first
    for (const selector of priceSelectors) {
      try {
        const elements = doc?.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.includes('$')) {
              price = text;
              usedSelector = selector;
              console.log('[Scraper] Found price with DOM selector:', { selector, price });
              break;
            }
          }
          if (price) break;
        }
      } catch (e) {
        console.log('[Scraper] Error with selector:', selector, e);
      }
    }
    
    // Comprehensive regex fallback if DOM parsing fails
    if (!price) {
      console.log('[Scraper] DOM selectors failed, trying comprehensive regex patterns');
      
      const regexPatterns = [
        // Standard price patterns
        /\$[\d,]+\.[\d]{2}/g,
        /\$[\d,]+/g,
        // Price with context
        /(?:price|Price|PRICE)[:\s]*\$?[\d,]+\.?[\d]*/gi,
        /(?:market|Market)[:\s]*\$?[\d,]+\.?[\d]*/gi,
        // JSON-like price patterns (for embedded data)
        /"price":\s*"?\$?[\d,]+\.?[\d]*"?/gi,
        /"market_price":\s*"?\$?[\d,]+\.?[\d]*"?/gi,
        // Any number with dollar sign
        /\$[\d,]+\.?\d*/g
      ];
      
      for (const pattern of regexPatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          console.log('[Scraper] Found potential prices with regex:', matches.slice(0, 5));
          
          // Filter valid prices (reasonable range and format)
          const validPrices = matches
            .map(match => {
              const cleanMatch = match.replace(/[^\d.$]/g, '');
              const numericValue = parseFloat(cleanMatch.replace(/[^\d.]/g, ''));
              return { original: match, clean: cleanMatch, numeric: numericValue };
            })
            .filter(p => p.numeric > 0 && p.numeric < 10000 && !isNaN(p.numeric))
            .sort((a, b) => b.numeric - a.numeric); // Sort highest first
          
          if (validPrices.length > 0) {
            price = validPrices[0].clean;
            console.log('[Scraper] Selected price from regex:', { 
              pattern: pattern.toString(), 
              selected: price,
              allValid: validPrices.map(p => p.clean)
            });
            break;
          }
        }
      }
    }

    if (!price) {
      console.error('[Scraper] No price found with any method');
      console.log('[Scraper] HTML analysis:', {
        containsDollar: html.includes('$'),
        containsPrice: html.toLowerCase().includes('price'),
        containsMarket: html.toLowerCase().includes('market'),
        htmlLength: html.length,
        firstDollarContext: html.substring(Math.max(0, html.indexOf('$') - 50), html.indexOf('$') + 50),
        priceContext: html.toLowerCase().includes('price') ? 
          html.substring(Math.max(0, html.toLowerCase().indexOf('price') - 50), html.toLowerCase().indexOf('price') + 100) : 
          'No price text found'
      });
      throw new Error("Price not found in page content after comprehensive search");
    }

    // Clean and validate price
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    if (!cleanPrice || isNaN(parseFloat(cleanPrice))) {
      throw new Error(`Invalid price format: ${price}`);
    }

    // Format price to always have 2 decimal places
    const formattedPrice = parseFloat(cleanPrice).toFixed(2);

    console.log('[Scraper] Successfully scraped price:', {
      raw: price,
      cleaned: cleanPrice,
      formatted: formattedPrice,
      method: usedSelector ? `DOM(${usedSelector})` : 'Regex',
      url: url
    });

    // Store formatted price in cache
    priceCache.set(url, {
      price: `$${formattedPrice}`,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    const now = Date.now();
    for (const [key, entry] of priceCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        priceCache.delete(key);
      }
    }

    return new Response(JSON.stringify({ 
      price: `$${formattedPrice}`,
      productId,
      method: usedSelector ? `DOM(${usedSelector})` : 'Regex',
      cached: false
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    throw err; // Let the caller handle the error
  }
}
