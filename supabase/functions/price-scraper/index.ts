
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

// Format search query in the specific required format
const generateSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string): string => {
  // For Pokemon cards with specific pattern MLTRS/ZPDS/ARTCN, use this exact format:
  // POKEMON SM BLACK STAR PROMO MLTRS/ZPDS/ARTCN.GX#SM210 PSA 10
  
  // Format set name properly (if provided)
  let formattedSet = '';
  if (setName && setName.trim() !== '') {
    formattedSet = setName.trim().toUpperCase();
  }
  
  // Format card number with # prefix (if provided)
  let formattedNumber = '';
  if (cardNumber && cardNumber.trim() !== '') {
    formattedNumber = cardNumber.trim().includes('#') ? 
      cardNumber.trim() : 
      `#${cardNumber.trim()}`;
  }
  
  // Build the search query in the exact format requested
  return `POKEMON ${formattedSet} ${cardName} ${formattedNumber} PSA ${grade}`.trim();
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
  
  // Create the parser outside the try-catch blocks so it's available throughout the function
  const parser = new DOMParser();
  
  // Get the initial page to get cookies and form structure
  console.log("Fetching initial page to prepare for form submission...");
  try {
    const initialResponse = await fetch('https://130point.com/cards/', { headers });
    if (!initialResponse.ok) {
      console.error(`Failed to fetch initial page: ${initialResponse.status}`);
      throw new Error(`Error accessing search site: ${initialResponse.status}`);
    }
    
    // Store cookies for session
    cookies = initialResponse.headers.get('set-cookie') || '';
    const initialHtml = await initialResponse.text();
    
    // Parse the HTML to get form details
    const document = parser.parseFromString(initialHtml, 'text/html');
    if (!document) {
      throw new Error("Failed to parse initial HTML");
    }
  } catch (error) {
    console.error("Error during initial page fetch:", error);
    throw new Error(`Failed to access search site: ${error.message}`);
  }
  
  // Add slight delay between requests to mimic human behavior
  await addRandomDelay();
  
  try {
    console.log(`Submitting search query: "${searchQuery}"`);
    
    // Create form data for submission
    const params = new URLSearchParams();
    params.append('search', searchQuery);
    params.append('searchButton', '');
    params.append('sortBy', 'date_desc');
    
    // Create the search URL for reference
    searchUrl = `https://130point.com/cards/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
    
    // Submit the form
    const searchResponse = await fetch('https://130point.com/cards/', {
      method: 'POST',
      headers: {
        ...headers,
        'Cookie': cookies,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    if (!searchResponse.ok) {
      console.error(`Error submitting search: ${searchResponse.status}`);
      throw new Error(`Failed to submit search: ${searchResponse.status}`);
    }
    
    const html = await searchResponse.text();
    
    // Parse the search results HTML
    const resultDocument = parser.parseFromString(html, 'text/html');
    if (!resultDocument) {
      console.error('Failed to parse search results HTML');
      throw new Error('Failed to parse search results HTML');
    }
    
    // Check if we got any results by looking for the table
    const resultsTable = resultDocument.querySelector('table.sales-table');
    if (!resultsTable) {
      console.log(`No results table found for query: "${searchQuery}"`);
      return {
        error: "No sales data found for this card",
        searchUrl,
        query: searchQuery
      };
    }
    
    // Extract sales data from the table
    const rows = resultDocument.querySelectorAll('table.sales-table tr');
    const sales = [];
    
    // Skip the header row and process the data rows
    for (let i = 1; i < rows.length && sales.length < 15; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) continue;
      
      const priceText = cells[4]?.textContent?.trim() || '';
      if (!priceText) continue;
      
      // Extract the price value (removing currency symbols and commas)
      const priceMatch = priceText.match(/[\d,.]+/);
      if (!priceMatch) continue;
      
      const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
      if (isNaN(priceValue)) continue;
      
      const title = cells[1]?.textContent?.trim() || '';
      const linkElement = cells[1]?.querySelector('a');
      const link = linkElement ? (linkElement.getAttribute('href') || '') : '';
      
      sales.push({
        date: cells[0]?.textContent?.trim() || '',
        title: title,
        link: link,
        auction: cells[2]?.textContent?.trim() || '',
        bids: cells[3]?.textContent?.trim() || '',
        price: priceValue
      });
    }
    
    if (sales.length === 0) {
      console.log(`No valid price data found for query: "${searchQuery}"`);
      return {
        error: "No sales data found for this card",
        searchUrl,
        query: searchQuery
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
      query: searchQuery
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
      query: searchQuery
    };
  }
};

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
