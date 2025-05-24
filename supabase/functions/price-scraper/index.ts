
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

// Transform abbreviated card names to full names (mainly for Pokémon)
const transformPokemonName = (name: string): string[] => {
  const nameMappings: Record<string, string> = {
    'MLTRS/ZPDS/ARTCN': 'Moltres Zapdos Articuno',
    'LTNG/FRFR/ZAPDOS': 'Lightning Fire Zapdos',
    'CHARIZRD': 'Charizard',
    'PIKACH': 'Pikachu',
    'MEWTWX': 'Mewtwo X',
    'BLSTOIS': 'Blastoise',
    'VNSR': 'Venusaur',
    'GNGR': 'Gengar'
  };

  // Create variants of the name
  const variants: string[] = [name]; // Original name
  const upperName = name.toUpperCase();
  
  // Check for mapped names
  for (const [abbr, full] of Object.entries(nameMappings)) {
    if (upperName.includes(abbr)) {
      variants.push(name.replace(new RegExp(abbr, 'i'), full));
      break;
    }
  }
  
  // Pokemon special case: extract base name before special types
  const pokemonNameMatch = name.match(/^(.*?)\s(?:V|GX|EX|VMAX|VSTAR)/i);
  if (pokemonNameMatch) {
    variants.push(pokemonNameMatch[1].trim());
  }
  
  // Remove special characters from all variants and clean up
  return variants.map(variant => 
    variant.replace(/[^\w\s\d]/g, ' ') // Replace special chars with spaces
           .replace(/\s+/g, ' ')       // Remove extra spaces
           .trim()
  ).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
};

// Format search query for different attempts
const generateSearchQueries = (cardName: string, setName: string, cardNumber: string, grade: string): string[] => {
  // Get possible name variants
  const nameVariants = transformPokemonName(cardName);
  
  const queries: string[] = [];
  
  // Generate multiple query formats
  nameVariants.forEach(nameVariant => {
    // Base query with just the card name and grade
    queries.push(`${nameVariant} PSA ${grade}`);
    
    // Query with set name
    if (setName && setName.trim() !== '') {
      queries.push(`${nameVariant} ${setName} PSA ${grade}`);
    }
    
    // Query with card number
    if (cardNumber && cardNumber.trim() !== '') {
      // Format with hashtag
      if (!cardNumber.includes('#')) {
        queries.push(`${nameVariant} #${cardNumber} PSA ${grade}`);
      } else {
        queries.push(`${nameVariant} ${cardNumber} PSA ${grade}`);
      }
      
      // Query with set name and card number
      if (setName && setName.trim() !== '') {
        queries.push(`${nameVariant} ${setName} ${cardNumber} PSA ${grade}`);
      }
    }
  });
  
  // Remove any duplicate queries and return
  return [...new Set(queries)];
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
    'Cache-Control': 'max-age=0',
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
  
  // Generate search query variations to try
  const searchQueries = generateSearchQueries(cardName, setName, cardNumber, grade);
  console.log(`Generated ${searchQueries.length} search variations to try:`, searchQueries);
  
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
    const parser = new DOMParser();
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
  
  // Try each search query until we find results
  for (const searchQuery of searchQueries) {
    try {
      console.log(`Trying search query: "${searchQuery}"`);
      
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
        continue; // Try next query
      }
      
      const html = await searchResponse.text();
      
      // Parse the search results HTML
      const resultDocument = parser.parseFromString(html, 'text/html');
      if (!resultDocument) {
        console.error('Failed to parse search results HTML');
        continue; // Try next query
      }
      
      // Check if we got any results by looking for the table
      const resultsTable = resultDocument.querySelector('table.sales-table');
      if (!resultsTable) {
        console.log(`No results table found for query: "${searchQuery}"`);
        continue; // Try next query
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
        continue; // Try next query
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
    } catch (queryError) {
      console.error(`Error with search query "${searchQuery}":`, queryError);
      // Continue to the next query
    }
    
    // Add slight delay between queries
    await addRandomDelay();
  }
  
  // No results found with any query
  return {
    error: "No sales data found for this card",
    searchUrl,
    query: searchQueries.join(", ")
  };
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
