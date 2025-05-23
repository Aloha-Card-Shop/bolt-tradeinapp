
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    // Build the search query for 130point.com
    // Format: cardName + setName + cardNumber (if available)
    let searchQuery = cardName;
    if (setName) {
      searchQuery += ` ${setName}`;
    }
    if (cardNumber) {
      searchQuery += ` #${cardNumber}`;
    }
    
    // Add PSA and grade
    searchQuery += ` PSA ${grade}`;
    
    // URL encode the search query for the URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://130point.com/cards/?search=${encodedQuery}&searchButton=&sortBy=date_desc`;
    
    // Fetch data from 130point.com
    console.log(`Requesting data from ${searchUrl}`);
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      console.error(`Error fetching from 130point.com: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: `Error fetching price data: ${response.status} ${response.statusText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const html = await response.text();
    
    // Parse the HTML response
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    
    if (!document) {
      console.error('Failed to parse HTML response');
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse response data" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract sales data from the table
    const rows = document.querySelectorAll('table.sales-table tr');
    const sales = [];

    // Skip the header row and process the data rows
    for (let i = 1; i < rows.length && sales.length < 5; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      if (cells.length < 5) continue;
      
      const priceText = cells[4].textContent.trim();
      // Extract the price value (removing currency symbols and commas)
      const priceMatch = priceText.match(/[\d,.]+/);
      if (!priceMatch) continue;
      
      const priceValue = parseFloat(priceMatch[0].replace(/,/g, ''));
      
      if (isNaN(priceValue)) continue;
      
      sales.push({
        date: cells[0].textContent.trim(),
        title: cells[1].textContent.trim(),
        link: cells[1].querySelector('a')?.getAttribute('href') || '',
        auction: cells[2].textContent.trim(),
        bids: cells[3].textContent.trim(),
        price: priceValue
      });
    }

    if (sales.length === 0) {
      console.log('No sales data found for the card');
      return new Response(
        JSON.stringify({ 
          error: "No sales data found for this card", 
          searchUrl 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate average price
    const initialAverage = sales.reduce((sum, sale) => sum + sale.price, 0) / sales.length;
    
    // Filter out outliers (±30% from the average)
    const filteredSales = sales.filter(sale => {
      const lowerBound = initialAverage * 0.7;
      const upperBound = initialAverage * 1.3;
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
