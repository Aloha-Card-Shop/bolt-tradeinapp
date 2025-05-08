import { DOMParser } from "npm:linkedom@0.16.11";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

interface ScrapeRequest {
  url: string;
  productId: string;
  condition: string;
  language: string;
  isFirstEdition?: boolean;
  isHolo?: boolean;
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

    console.log('[Scraper] Fetching TCGPlayer page:', url);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

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