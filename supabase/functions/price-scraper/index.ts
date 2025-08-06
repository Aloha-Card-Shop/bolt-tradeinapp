
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.29.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool of user agents to rotate through for anti-bot evasion
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1"
];

// Cache for storing price data
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Firecrawl configuration
const FIRECRAWL_API_KEY = 'fc-2dea0a85f9e84cb6ae0783193103e207';
let firecrawlApp: FirecrawlApp | null = null;

const getFirecrawlApp = (): FirecrawlApp => {
  if (!firecrawlApp) {
    firecrawlApp = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
  }
  return firecrawlApp;
};

// Format search query in the specific required format
const generateSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string): string => {
  // Use the exact format: POKEMON SET_NAME CARD_NAME #CARD_NUMBER PSA GRADE
  let query = "POKEMON";
  
  // Add set name
  if (setName && setName.trim() !== '') {
    query += ` ${setName.trim().toUpperCase()}`;
  }
  
  // Add card name
  query += ` ${cardName.trim()}`;
  
  // Add card number with # prefix
  if (cardNumber && cardNumber.trim() !== '') {
    query += ` ${cardNumber.trim().includes('#') ? cardNumber.trim() : '#' + cardNumber.trim()}`;
  }
  
  // Add PSA and grade
  query += ` PSA ${grade.trim()}`;
  
  console.log(`Generated search query: "${query}"`);
  return query;
};

// Get a random user agent with browser fingerprinting
const getRandomUserAgent = () => {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
};

// Get browser-like headers to avoid detection
const getBrowserHeaders = (userAgent: string) => {
  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://130point.com/cards/',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
};

// Add random delay to mimic human behavior
const addRandomDelay = async (min = 500, max = 1500) => {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Scrape the price data from 130point.com
const scrapePrice = async (
  cardName: string, 
  setName: string, 
  cardNumber: string, 
  grade: string
): Promise<any> => {
  console.log(`Scraping price for card: "${cardName}" from set: "${setName}" with number: "${cardNumber}" and grade: "PSA ${grade}"`);
  
  // Generate search query in the specific requested format
  const searchQuery = generateSearchQuery(cardName, setName, cardNumber, grade);
  console.log(`Using search query: "${searchQuery}"`);
  
  // Use randomized user agent for this session
  const userAgent = getRandomUserAgent();
  const headers = getBrowserHeaders(userAgent);
  
  // Cache key for storing/retrieving results
  const cacheKey = `${cardName}|${setName}|${cardNumber}|${grade}`;
  
  // Check cache first
  const cachedResult = priceCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`Returning cached price data for "${cardName}" (PSA ${grade})`);
    return cachedResult.data;
  }
  
  let cookies = '';
  let searchUrl = '';
  let debugData: any = {
    requestHeaders: headers,
    searchQuery: searchQuery,
    timing: {}
  };
  
  // Create the parser outside the try-catch blocks so it's available throughout the function
  const parser = new DOMParser();
  
  // Use Firecrawl to scrape 130point data
  console.log(`Using Firecrawl to search 130point for: "${searchQuery}"`);
  const startTime = Date.now();
  
  try {
    const app = getFirecrawlApp();
    const encodedQuery = encodeURIComponent(searchQuery);
    searchUrl = `https://130point.com/sales/?search=${encodedQuery}&searchButton=&sortBy=date_desc`;
    debugData.searchUrl = searchUrl;
    
    const scrapeResult = await app.scrapeUrl(searchUrl, {
      formats: ['markdown', 'html']
    });
    
    debugData.timing.firecrawlScrape = Date.now() - startTime;
    
    if (!scrapeResult.success) {
      console.error('Firecrawl scraping failed');
      debugData.firecrawlError = 'Scraping failed';
      throw new Error('Failed to scrape 130point data');
    }
    
    const html = (scrapeResult as any).data?.html || '';
    const markdownContent = (scrapeResult as any).data?.markdown || '';
    
    debugData.resultsPageSize = html.length;
    debugData.markdownSize = markdownContent.length;
    debugData.htmlSnippet = html.substring(0, 500) + '...';
    
    if (html.length < 100 && markdownContent.length < 50) {
      console.log('Scraped content too short, likely no results');
      return {
        error: "No sales data found for this card",
        searchUrl,
        query: searchQuery,
        debug: debugData
      };
    }
    
    // Extract sales data from HTML and markdown content
    const sales = extractSalesFromContent(html, markdownContent);
    debugData.extractedSalesCount = sales.length;
    
    if (sales.length === 0) {
      console.log(`No valid price data found for query: "${searchQuery}"`);
      return {
        error: "No sales data found for this card",
        searchUrl,
        query: searchQuery,
        debug: debugData
      };
    }
    
    // We found sales data, calculate prices and prepare result
    console.log(`Found ${sales.length} sales records for query: "${searchQuery}"`);
    
    // Calculate average price
    const initialAverage = sales.reduce((sum, sale) => sum + sale.price, 0) / sales.length;
    
    // Filter out outliers (±50% from the average)
    const filteredSales = sales.filter(sale => {
      const lowerBound = initialAverage * 0.5;
      const upperBound = initialAverage * 1.5;
      return sale.price >= lowerBound && sale.price <= upperBound;
    });
    
    // Calculate the final average price from filtered sales
    const finalSales = filteredSales.length > 0 ? filteredSales : sales;
    const averagePrice = finalSales.reduce((sum, sale) => sum + sale.price, 0) / finalSales.length;
    
    console.log(`Average price: $${averagePrice.toFixed(2)} (from ${finalSales.length} filtered sales)`);
    
    // Prepare the result
    const result = {
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      salesCount: sales.length,
      filteredSalesCount: finalSales.length,
      sales: finalSales,
      allSales: sales,
      searchUrl,
      query: searchQuery,
      debug: debugData
    };
    
    // Cache the result
    priceCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    const now = Date.now();
    for (const [key, entry] of priceCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        priceCache.delete(key);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error with search query "${searchQuery}":`, error);
    return {
      error: error.message || "Failed to search for card data",
      searchUrl,
      query: searchQuery,
      debug: debugData
    };
  }
};

// Extract sales data from HTML and markdown content
function extractSalesFromContent(html: string, markdown: string): any[] {
  const sales = [];
  
  try {
    // Look for price patterns in the content
    const priceMatches = [...html.matchAll(/\$[\d,]+\.?\d*/g)];
    
    if (priceMatches.length === 0) {
      return [];
    }

    // Extract prices and create sales records
    const prices = priceMatches.slice(0, 15).map(match => {
      const priceString = match[0].replace(/[^\d.]/g, '');
      return parseFloat(priceString);
    }).filter(price => !isNaN(price) && price > 0);

    for (let i = 0; i < prices.length; i++) {
      sales.push({
        date: new Date().toISOString(),
        title: `Sale ${i + 1}`,
        link: '',
        auction: '130point',
        bids: '1',
        price: prices[i]
      });
    }

    return sales;
  } catch (error) {
    console.error('Error extracting sales data:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardName, setName, cardNumber, grade } = await req.json();
    
    if (!cardName) {
      return new Response(
        JSON.stringify({ error: "Card name is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Price scraper called for: ${cardName} #${cardNumber || 'N/A'} (PSA ${grade || 'N/A'}) from ${setName || 'N/A'}`);
    
    // Run the scraping operation
    const result = await scrapePrice(
      cardName,
      setName || '',
      cardNumber || '',
      grade || '10' // Default to PSA 10 if not provided
    );
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in price-scraper function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: 'Failed to scrape price data'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
