
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
const extractSalesFromHTML = (html: string): { sales: any[]; error?: string; htmlSnippet?: string } => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      return { 
        sales: [], 
        error: "Failed to parse HTML document",
        htmlSnippet: html.substring(0, 500) + "..." 
      };
    }

    // Check for page title to see if we've been blocked or redirected
    const pageTitle = doc.querySelector("title")?.textContent || "";
    if (pageTitle.toLowerCase().includes("captcha") || 
        pageTitle.toLowerCase().includes("blocked") || 
        pageTitle.toLowerCase().includes("access denied")) {
      return { 
        sales: [], 
        error: `Bot protection detected: ${pageTitle}`,
        htmlSnippet: html.substring(0, 500) + "..." 
      };
    }

    // Extract sales data from the table
    const salesTable = doc.querySelector('table.sales-table');
    if (!salesTable) {
      return { 
        sales: [], 
        error: "No sales table found on page",
        htmlSnippet: html.substring(0, 500) + "..." 
      };
    }

    const salesRows = Array.from(salesTable.querySelectorAll('tr:not(:first-child)'));
    if (!salesRows || salesRows.length === 0) {
      return { 
        sales: [], 
        error: "No sales data rows found in table",
        htmlSnippet: html.substring(0, 500) + "..." 
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

    return { sales };
  } catch (error) {
    return { 
      sales: [], 
      error: `HTML parsing error: ${error.message}`,
      htmlSnippet: html.substring(0, 500) + "..." 
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
  
  // Search URL for reference (not used directly but returned to frontend)
  const searchUrl = `https://130point.com/cards/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
  
  let debugData: any = {
    searchQuery,
    searchUrl,
    timing: {},
    errors: [],
    processSteps: []
  };
  
  try {
    // Set up the headers to mimic a browser request
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      "DNT": "1",
      "Connection": "keep-alive"
    };

    debugData.processSteps.push(`Making initial request to 130point.com/cards to get cookies and session`);
    const startTime = Date.now();
    
    // First make a GET request to get any cookies and session data
    const initialResponse = await fetch('https://130point.com/cards/', {
      method: 'GET',
      headers
    });

    if (!initialResponse.ok) {
      throw new Error(`Initial page load failed with status: ${initialResponse.status}`);
    }

    const cookies = initialResponse.headers.get('set-cookie');
    const initialHtml = await initialResponse.text();
    
    debugData.timing.initialRequest = Date.now() - startTime;
    debugData.processSteps.push(`Initial page loaded in ${debugData.timing.initialRequest}ms`);
    
    // Check initial HTML for any bot detection
    const initialTitle = initialHtml.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    debugData.pageTitle = initialTitle;
    
    if (initialTitle.toLowerCase().includes("captcha") || initialTitle.toLowerCase().includes("blocked")) {
      throw new Error(`Bot protection detected on initial page: ${initialTitle}`);
    }
    
    // Update headers with cookies if they exist
    const updatedHeaders = { ...headers };
    if (cookies) {
      updatedHeaders["Cookie"] = cookies;
    }
    
    debugData.processSteps.push(`Submitting search form with query "${searchQuery}"`);
    const searchStartTime = Date.now();
    
    // Now submit the search form with our query
    const formData = new URLSearchParams();
    formData.append("search", searchQuery);
    formData.append("searchButton", "");
    formData.append("sortBy", "date_desc");
    
    // Submit the search form
    const searchResponse = await fetch('https://130point.com/cards/', {
      method: 'POST',
      headers: updatedHeaders,
      body: formData,
      redirect: 'follow'
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search submission failed with status: ${searchResponse.status}`);
    }
    
    const resultsHtml = await searchResponse.text();
    debugData.timing.searchRequest = Date.now() - searchStartTime;
    debugData.processSteps.push(`Search results received in ${debugData.timing.searchRequest}ms`);
    
    // Store a snippet of the HTML for debugging
    debugData.htmlSnippet = resultsHtml.substring(0, 500) + "...";
    
    // Extract the page title for debugging
    const resultsTitle = resultsHtml.match(/<title>(.*?)<\/title>/i)?.[1] || "";
    debugData.resultsTitle = resultsTitle;
    
    // Extract sales data from HTML
    const extractionResult = extractSalesFromHTML(resultsHtml);
    const sales = extractionResult.sales;
    
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
        debug: debugData
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
      debug: debugData
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
