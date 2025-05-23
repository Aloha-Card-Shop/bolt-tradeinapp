
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool of user agents to rotate through for anti-bot evasion
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55"
];

// Get a random user agent
const getRandomUserAgent = () => {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
};

// Clean card name to improve search results
const cleanCardName = (cardName: string): string => {
  // Remove special characters that might interfere with search
  let cleaned = cardName
    .replace(/[^\w\s\d/.-]/g, ' ')  // Replace special chars with spaces
    .replace(/\s+/g, ' ')          // Remove extra spaces
    .trim();
    
  // Convert specific abbreviations that might help searches
  cleaned = cleaned
    .replace(/\bGX\b/i, "GX")      // Ensure GX is properly formatted
    .replace(/\bEX\b/i, "EX")      // Ensure EX is properly formatted
    .replace(/\bV\b/i, "V")        // Ensure V is properly formatted
    .replace(/\bVMAX\b/i, "VMAX")  // Ensure VMAX is properly formatted
    .replace(/\bVSTAR\b/i, "VSTAR"); // Ensure VSTAR is properly formatted
    
  return cleaned;
};

// Detect if the card name might be Pokemon related
const isPokemonCard = (cardName: string, setName: string): boolean => {
  const pokemonTerms = ['pokemon', 'pikachu', 'charizard', 'vmax', 'ex', 'gx', 'v-star', 'vstar', 'sm black star', 'swsh', 'sm'];
  const lowerName = cardName.toLowerCase();
  const lowerSet = setName.toLowerCase();
  
  return pokemonTerms.some(term => lowerName.includes(term) || lowerSet.includes(term));
};

// Format search query for form submission
const formatSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string): string => {
  let query = cleanCardName(cardName);
  
  // Add set name if available
  if (setName && setName.trim() !== '') {
    query += ` ${setName}`;
  }
  
  // Add card number with different formats to improve search chances
  if (cardNumber && cardNumber.trim() !== '') {
    // Try with # format
    if (!cardNumber.includes('#')) {
      query += ` #${cardNumber}`;
    } else {
      query += ` ${cardNumber}`;
    }
  }
  
  // Add grade information
  query += ` PSA ${grade}`;
  
  // Remove any double spaces
  return query.replace(/\s+/g, ' ').trim();
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
        JSON.stringify({ 
          error: "Card name is required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Looking up prices for ${cardName} #${cardNumber || 'N/A'} (PSA ${grade || 'N/A'})`);
    
    // Format the search query for the form
    const searchQuery = formatSearchQuery(cardName, setName || '', cardNumber || '', grade || '');
    console.log(`Formatted search query: "${searchQuery}"`);
    
    // Determine if this might be a Pokemon card (for search optimization)
    const isPokemon = isPokemonCard(cardName, setName || '');
    console.log(`Card detected as Pokemon: ${isPokemon}`);
    
    // Set up headers to look more like a real browser
    const userAgent = getRandomUserAgent();
    const headers = {
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
    
    console.log("Fetching initial page to get form structure...");
    
    // First fetch the main page to get cookies and form structure
    const initialResponse = await fetch('https://130point.com/cards/', {
      headers,
    });
    
    if (!initialResponse.ok) {
      console.error(`Error fetching initial page: ${initialResponse.status} ${initialResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `Error accessing search page: ${initialResponse.status} ${initialResponse.statusText}` 
        }),
        { 
          status: initialResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const initialHtml = await initialResponse.text();
    const cookies = initialResponse.headers.get('set-cookie') || '';
    
    console.log("Initial page fetched, preparing form submission...");
    
    // Parse HTML to get form details
    const parser = new DOMParser();
    const document = parser.parseFromString(initialHtml, 'text/html');
    
    if (!document) {
      console.error('Failed to parse initial HTML response');
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse search page" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Find the search form
    const searchForm = document.querySelector('form');
    
    if (!searchForm) {
      console.error('Could not find search form on page');
      return new Response(
        JSON.stringify({ 
          error: "Search form not found on page" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create form data for submission
    const formData = new FormData();
    formData.append('search', searchQuery);
    formData.append('searchButton', '');
    formData.append('sortBy', 'date_desc');
    
    // Convert FormData to URLSearchParams for fetch
    const params = new URLSearchParams();
    params.append('search', searchQuery);
    params.append('searchButton', '');
    params.append('sortBy', 'date_desc');
    
    console.log(`Submitting search form with query: "${searchQuery}"`);
    
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
      console.error(`Error submitting search: ${searchResponse.status} ${searchResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `Error performing search: ${searchResponse.status} ${searchResponse.statusText}` 
        }),
        { 
          status: searchResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const html = await searchResponse.text();
    
    // Generate a search URL for linking (for reference)
    const searchUrl = `https://130point.com/cards/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
    
    console.log(`Search completed, parsing results...`);
    
    // Parse the search results HTML
    const resultDocument = parser.parseFromString(html, 'text/html');
    
    if (!resultDocument) {
      console.error('Failed to parse search results HTML');
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse search results", 
          searchUrl,
          query: searchQuery
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check if we got any results by looking for the table
    const resultsTable = resultDocument.querySelector('table.sales-table');
    if (!resultsTable) {
      console.log('No results table found in response - no sales data available');
      return new Response(
        JSON.stringify({ 
          error: "No sales data found for this card", 
          searchUrl,
          query: searchQuery
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract sales data from the table
    const rows = resultDocument.querySelectorAll('table.sales-table tr');
    const sales = [];

    // Skip the header row and process the data rows
    for (let i = 1; i < rows.length && sales.length < 10; i++) {
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
      console.log('No valid sales data found in results table');
      return new Response(
        JSON.stringify({ 
          error: "No sales data found for this card", 
          searchUrl,
          query: searchQuery
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${sales.length} sales records for analysis`);

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
    
    console.log(`Found ${sales.length} sales, using ${finalSales.length} sales for average`);
    console.log(`Average price: $${averagePrice.toFixed(2)}`);

    // Return the results
    return new Response(
      JSON.stringify({
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        salesCount: sales.length,
        filteredSalesCount: finalSales.length,
        sales: finalSales,
        allSales: sales,
        searchUrl,
        query: searchQuery
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in psa-price-lookup function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
