
// Import required libraries for Deno environment
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for storing price data
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Pool of user agents to rotate through for anti-bot detection evasion
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1"
];

// Format search query for the specific site format
const formatSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string): string => {
  let query = "POKEMON";
  
  // Add set name if available
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

// Get a random user agent to avoid bot detection
const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// Add random delay to mimic human behavior
const addRandomDelay = async (min = 500, max = 2000) => {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of priceCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      priceCache.delete(key);
    }
  }
}, 30 * 60 * 1000); // Check every 30 minutes

// Function to extract sales data from HTML
const extractSalesFromHTML = (html: string): { 
  sales: any[]; 
  error?: string; 
  htmlSnippet?: string;
  pageTitle?: string;
} => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      return { 
        sales: [], 
        error: "Failed to parse HTML document",
        htmlSnippet: html.substring(0, 1000) + "..." 
      };
    }

    // Extract page title for debugging
    const pageTitle = doc.querySelector("title")?.textContent || "";
    
    // Check for page title to see if we've been blocked or redirected
    if (pageTitle.toLowerCase().includes("captcha") || 
        pageTitle.toLowerCase().includes("blocked") || 
        pageTitle.toLowerCase().includes("access denied") ||
        pageTitle.toLowerCase().includes("cloudflare")) {
      return { 
        sales: [], 
        error: `Bot protection detected: ${pageTitle}`,
        htmlSnippet: html.substring(0, 1000) + "...",
        pageTitle
      };
    }

    // Extract sales data from the table
    const salesTable = doc.querySelector('table.sales-table');
    if (!salesTable) {
      // Try to find any error messages on the page
      const errorMessages = doc.querySelectorAll('.error-message, .alert, .notification');
      const errors = Array.from(errorMessages).map(el => el.textContent?.trim()).filter(Boolean);
      
      return { 
        sales: [], 
        error: errors.length > 0 
          ? `No sales table found: ${errors.join(', ')}` 
          : "No sales table found on page",
        htmlSnippet: html.substring(0, 1000) + "...",
        pageTitle 
      };
    }

    const salesRows = Array.from(salesTable.querySelectorAll('tr:not(:first-child)'));
    if (!salesRows || salesRows.length === 0) {
      return { 
        sales: [], 
        error: "No sales data rows found in table",
        htmlSnippet: html.substring(0, 1000) + "...",
        pageTitle 
      };
    }

    const sales = salesRows.map((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 5) return null;
      
      const priceText = cells[4]?.textContent?.trim() || '';
      if (!priceText) return null;
      
      // Extract numeric price
      const priceMatch = priceText.match(/[\d,.]+/);
      if (!priceMatch) return null;
      
      const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
      if (isNaN(priceValue)) return null;
      
      const title = cells[1]?.textContent?.trim() || '';
      const linkElement = cells[1]?.querySelector('a');
      const link = linkElement ? (linkElement as Element).getAttribute('href') || '' : '';
      
      return {
        date: cells[0]?.textContent?.trim() || '',
        title: title,
        link: link,
        auction: cells[2]?.textContent?.trim() || '',
        bids: cells[3]?.textContent?.trim() || '',
        price: priceValue
      };
    }).filter(item => item !== null);

    return { 
      sales,
      pageTitle,
      htmlSnippet: salesTable.outerHTML.substring(0, 1000) + "..." 
    };
  } catch (error) {
    return { 
      sales: [], 
      error: `HTML parsing error: ${error.message}`,
      htmlSnippet: html.substring(0, 1000) + "..." 
    };
  }
};

// Main scraping function
async function scrapePriceWithDenoDom(
  cardName: string, 
  setName: string, 
  cardNumber: string, 
  grade: string
): Promise<any> {
  console.log(`Starting price scrape for: ${cardName} (Set: ${setName}, Number: ${cardNumber}, Grade: PSA ${grade})`);
  
  // Generate search query
  const searchQuery = formatSearchQuery(cardName, setName, cardNumber, grade);
  
  // Create cache key
  const cacheKey = `${cardName}|${setName}|${cardNumber}|${grade}`;
  
  // Check cache first
  const cachedResult = priceCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
    console.log(`Returning cached price data for "${cardName}" (PSA ${grade})`);
    return cachedResult.data;
  }
  
  // The correct URL for 130point.com searches - this is the actual URL we need to submit the form to
  const FORM_SUBMIT_URL = 'https://130point.com/cards/';
  
  // Reference search URL (only for frontend reference, not used for scraping)
  const searchUrl = `https://130point.com/cards/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
  
  let debugData: any = {
    searchQuery,
    searchUrl,
    formSubmitUrl: FORM_SUBMIT_URL,
    timing: {},
    errors: [],
    processSteps: []
  };
  
  try {
    // Select a random user agent
    const userAgent = getRandomUserAgent();
    
    // Set up the headers to mimic a browser request
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://130point.com/cards/",
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      "DNT": "1",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin"
    };
    
    debugData.headers = { ...headers };
    debugData.processSteps.push(`Using user agent: ${userAgent}`);
    debugData.processSteps.push(`Making initial request to 130point.com/cards to get cookies and session`);
    const startTime = Date.now();
    
    // First make a GET request to get any cookies and session data
    const initialResponse = await fetch(FORM_SUBMIT_URL, {
      method: 'GET',
      headers
    });

    if (!initialResponse.ok) {
      debugData.errors.push(`Initial page load failed with status: ${initialResponse.status}`);
      throw new Error(`Initial page load failed with status: ${initialResponse.status}`);
    }

    const cookies = initialResponse.headers.get('set-cookie');
    debugData.cookies = cookies ? 'Received cookies' : 'No cookies received';
    
    const initialHtml = await initialResponse.text();
    debugData.timing.initialRequest = Date.now() - startTime;
    debugData.processSteps.push(`Initial page loaded in ${debugData.timing.initialRequest}ms`);
    
    // Parse the initial HTML to check form structure
    const initialDoc = new DOMParser().parseFromString(initialHtml, "text/html");
    if (!initialDoc) {
      debugData.errors.push("Failed to parse initial HTML");
      throw new Error("Failed to parse initial HTML");
    }
    
    // Check initial HTML for any bot detection
    const initialTitle = initialDoc.querySelector("title")?.textContent || "";
    debugData.initialPageTitle = initialTitle;
    
    if (initialTitle.toLowerCase().includes("captcha") || 
        initialTitle.toLowerCase().includes("blocked") ||
        initialTitle.toLowerCase().includes("cloudflare")) {
      debugData.errors.push(`Bot protection detected on initial page: ${initialTitle}`);
      throw new Error(`Bot protection detected on initial page: ${initialTitle}`);
    }
    
    // Add a random delay to mimic human behavior
    await addRandomDelay();
    debugData.processSteps.push("Added random delay to mimic human behavior");
    
    // Update headers with cookies if they exist
    const updatedHeaders = { ...headers };
    if (cookies) {
      updatedHeaders["Cookie"] = cookies;
      debugData.processSteps.push("Added cookies to request headers");
    }
    
    debugData.processSteps.push(`Submitting search form with query "${searchQuery}"`);
    const searchStartTime = Date.now();
    
    // Now submit the search form with our query - ALWAYS to the FORM_SUBMIT_URL
    const formData = new URLSearchParams();
    formData.append("search", searchQuery);
    formData.append("searchButton", "");
    formData.append("sortBy", "date_desc");
    
    debugData.processSteps.push(`Submitting form to URL: ${FORM_SUBMIT_URL}`);
    debugData.formSubmissionUrl = FORM_SUBMIT_URL;
    debugData.formData = Object.fromEntries(formData.entries());
    
    // Submit the search form with POST method directly to the FORM_SUBMIT_URL
    const searchResponse = await fetch(FORM_SUBMIT_URL, {
      method: 'POST',
      headers: updatedHeaders,
      body: formData,
      redirect: 'follow'
    });
    
    if (!searchResponse.ok) {
      debugData.errors.push(`Search submission failed with status: ${searchResponse.status}`);
      throw new Error(`Search submission failed with status: ${searchResponse.status}`);
    }
    
    const resultsHtml = await searchResponse.text();
    debugData.timing.searchRequest = Date.now() - searchStartTime;
    debugData.processSteps.push(`Search results received in ${debugData.timing.searchRequest}ms`);
    debugData.resultsSize = resultsHtml.length;
    
    // Store a larger snippet of the HTML for debugging
    debugData.htmlSnippet = resultsHtml.substring(0, 1000) + "...";
    
    // Extract sales data from HTML
    const extractionResult = extractSalesFromHTML(resultsHtml);
    const sales = extractionResult.sales;
    
    // Add page title to debug data
    debugData.resultsTitle = extractionResult.pageTitle;
    
    if (extractionResult.error) {
      debugData.errors.push(extractionResult.error);
    }
    
    if (sales.length === 0) {
      console.log("No valid sales data found");
      
      // Return error with debug data
      const errorResult = {
        error: "No sales data found for this card",
        searchUrl,
        query: searchQuery,
        debug: debugData,
        timestamp: new Date().toISOString()
      };
      
      // Cache the error result too
      priceCache.set(cacheKey, {
        data: errorResult,
        timestamp: Date.now()
      });
      
      return errorResult;
    }
    
    debugData.salesCount = sales.length;
    console.log(`Found ${sales.length} sales records`);
    
    // Calculate average price
    const initialAverage = sales.reduce((sum, sale) => sum + sale.price, 0) / sales.length;
    
    // Filter out outliers (±50% from the average)
    const filteredSales = sales.filter(sale => {
      const lowerBound = initialAverage * 0.5;
      const upperBound = initialAverage * 1.5;
      return sale.price >= lowerBound && sale.price <= upperBound;
    });
    
    // Calculate final average
    const finalSales = filteredSales.length > 0 ? filteredSales : sales;
    const averagePrice = finalSales.reduce((sum, sale) => sum + sale.price, 0) / finalSales.length;
    
    console.log(`Average price: $${averagePrice.toFixed(2)} (filtered from ${sales.length} to ${finalSales.length} sales)`);
    
    // Prepare the result
    const result = {
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      salesCount: sales.length,
      filteredSalesCount: finalSales.length,
      sales: finalSales,
      allSales: sales,
      searchUrl,
      query: searchQuery,
      debug: debugData,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    priceCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error(`Error during price scraping: ${error.message}`);
    
    // Add error to debug data
    debugData.errors.push(error.message);
    
    // Return error with any debug data collected
    return {
      error: `Failed to scrape price data: ${error.message}`,
      searchUrl,
      query: searchQuery,
      debug: debugData,
      timestamp: new Date().toISOString()
    };
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
    const result = await scrapePriceWithDenoDom(
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
