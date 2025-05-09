
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
    
    // Try multiple selectors for price
    const priceSelectors = [
      ".spotlight__price",
      "[data-testid='price-guide-price']",
      ".price-guide__spotlight-price"
    ];
    
    let price: string | undefined;
    for (const selector of priceSelectors) {
      const priceEl = doc?.querySelector(selector);
      if (priceEl?.textContent) {
        price = priceEl.textContent.trim();
        console.log('[Scraper] Found price with selector:', { selector, price });
        break;
      }
    }

    if (!price) {
      console.error('[Scraper] Price not found. DOM structure:', {
        head: doc?.querySelector('head')?.innerHTML,
        body: doc?.querySelector('body')?.innerHTML.substring(0, 500) + '...'
      });
      throw new Error("Price not found in page content");
    }

    // Clean and validate price
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    if (!cleanPrice || isNaN(parseFloat(cleanPrice))) {
      throw new Error(`Invalid price format: ${price}`);
    }

    console.log('[Scraper] Successfully scraped price:', {
      raw: price,
      cleaned: cleanPrice
    });

    // Store in cache
    priceCache.set(url, {
      price: `$${cleanPrice}`,
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
      price: `$${cleanPrice}`,
      productId 
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
