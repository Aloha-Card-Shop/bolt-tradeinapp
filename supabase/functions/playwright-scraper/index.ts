
// Import required libraries
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Puppeteer } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

// Main scraping function
async function scrapePriceWithPuppeteer(
  cardName: string, 
  setName: string, 
  cardNumber: string, 
  grade: string
): Promise<any> {
  console.log(`Starting Puppeteer scrape for: ${cardName} (Set: ${setName}, Number: ${cardNumber}, Grade: PSA ${grade})`);
  
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
  
  let browser = null;
  let debugData: any = {
    searchQuery,
    searchUrl,
    timing: {},
    errors: [],
    screenshots: {}
  };
  
  try {
    console.log("Launching headless browser...");
    const startLaunchTime = Date.now();
    
    // Initialize Puppeteer with more robust options
    const puppeteer = new Puppeteer();
    
    // Launch browser with appropriate options for serverless environment
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ],
      timeout: 60000 // Increase timeout to 60 seconds
    });
    
    debugData.timing.browserLaunch = Date.now() - startLaunchTime;
    console.log(`Browser launched in ${debugData.timing.browserLaunch}ms`);
    
    // Create new page with longer timeout
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(90000); // 90 seconds timeout for navigation
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36");
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to 130point.com with retry mechanism
    console.log("Navigating to 130point.com/cards...");
    let retries = 0;
    const maxRetries = 3;
    let navigationSuccess = false;
    
    while (retries < maxRetries && !navigationSuccess) {
      try {
        const startNavTime = Date.now();
        await page.goto('https://130point.com/cards/', { 
          waitUntil: 'networkidle0',
          timeout: 60000 // 60 second timeout
        });
        debugData.timing.initialNavigation = Date.now() - startNavTime;
        navigationSuccess = true;
      } catch (error) {
        retries++;
        console.error(`Navigation attempt ${retries} failed: ${error.message}`);
        debugData.errors.push(`Navigation attempt ${retries} failed: ${error.message}`);
        
        if (retries >= maxRetries) {
          throw new Error(`Failed to navigate to 130point.com after ${maxRetries} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Take screenshot of the initial page
    try {
      debugData.screenshots.initialPage = await page.screenshot({ 
        encoding: "base64", 
        type: "jpeg", 
        quality: 80 
      });
    } catch (screenshotError) {
      console.error("Failed to take initial page screenshot:", screenshotError);
      debugData.errors.push(`Screenshot error: ${screenshotError.message}`);
    }
    
    // Fill the search form
    console.log(`Filling search form with query: "${searchQuery}"`);
    try {
      await page.type('input[name="search"]', searchQuery);
    } catch (inputError) {
      console.error("Failed to input search query:", inputError);
      debugData.errors.push(`Input error: ${inputError.message}`);
      
      // Return error result with debug data
      const errorResult = {
        error: "Failed to input search query",
        searchUrl,
        query: searchQuery,
        debug: debugData
      };
      return errorResult;
    }
    
    // Take screenshot of filled form
    try {
      debugData.screenshots.filledForm = await page.screenshot({ 
        encoding: "base64", 
        type: "jpeg", 
        quality: 80 
      });
    } catch (screenshotError) {
      console.error("Failed to take filled form screenshot:", screenshotError);
      debugData.errors.push(`Screenshot error: ${screenshotError.message}`);
    }
    
    // Submit the search form
    console.log("Submitting search form...");
    const searchStartTime = Date.now();
    
    try {
      // Click the search button and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
        page.click('input[name="searchButton"]')
      ]);
      
      debugData.timing.searchSubmission = Date.now() - searchStartTime;
      console.log(`Search completed in ${debugData.timing.searchSubmission}ms`);
    } catch (searchError) {
      console.error("Search submission failed:", searchError);
      debugData.errors.push(`Search error: ${searchError.message}`);
      
      // Try to continue anyway and check for results
    }
    
    // Take screenshot of results page
    try {
      debugData.screenshots.resultsPage = await page.screenshot({ 
        encoding: "base64", 
        type: "jpeg", 
        quality: 80 
      });
    } catch (screenshotError) {
      console.error("Failed to take results page screenshot:", screenshotError);
      debugData.errors.push(`Screenshot error: ${screenshotError.message}`);
    }
    
    // Check if results table exists
    const hasResultsTable = await page.evaluate(() => {
      return document.querySelector('table.sales-table') !== null;
    });
    
    if (!hasResultsTable) {
      console.log("No results table found on the page");
      debugData.errors.push("No sales data table found");
      
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
    
    // Extract sales data from the table
    console.log("Extracting sales data from results table...");
    const sales = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.sales-table tr:not(:first-child)'));
      return rows.map(row => {
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
        const link = linkElement ? linkElement.getAttribute('href') || '' : '';
        
        return {
          date: cells[0]?.textContent?.trim() || '',
          title: title,
          link: link,
          auction: cells[2]?.textContent?.trim() || '',
          bids: cells[3]?.textContent?.trim() || '',
          price: priceValue
        };
      }).filter(item => item !== null);
    });
    
    debugData.salesCount = sales.length;
    console.log(`Found ${sales.length} sales records`);
    
    if (sales.length === 0) {
      console.log("No valid sales data extracted from table");
      debugData.errors.push("No valid sales data extracted");
      
      // Return error with debug data
      const errorResult = {
        error: "No valid sales data found for this card",
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
      debug: debugData
    };
    
    // Cache the result
    priceCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error(`Error during Puppeteer scraping: ${error.message}`);
    
    // Add error to debug data
    debugData.errors.push(error.message);
    
    // Return error with any debug data collected
    return {
      error: `Failed to scrape price data: ${error.message}`,
      searchUrl,
      query: searchQuery,
      debug: debugData
    };
  } finally {
    // Always close the browser
    if (browser) {
      console.log("Closing browser...");
      try {
        await browser.close();
        console.log("Browser closed successfully");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
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
    const result = await scrapePriceWithPuppeteer(
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
