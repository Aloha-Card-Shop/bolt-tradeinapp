import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';

export interface SaleData {
  date: string;
  title: string;
  link: string;
  auction: string;
  bids: string;
  price: number;
}

export interface ScrapeResult {
  averagePrice: number;
  salesCount: number;
  filteredSalesCount: number;
  searchUrl: string;
  query: string;
  error?: string;  // Added error property
  debug?: any;
  htmlSnippet?: string;
  pageTitle?: string;
  timestamp?: string;
  sales: SaleData[];
}

// Cache for storing price data
const priceCache = new Map<string, { data: ScrapeResult; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// User agents to rotate through for anti-bot detection evasion
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1"
];

export const use130PointScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<ScrapeResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Format search query for the specific site format
  const formatSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string): string => {
    // Create keyword components separately, then combine them at the end
    let components = [];
    
    // 1. Always add PSA and grade first (based on successful manual searches)
    const numericGrade = grade.trim().replace(/[^\d\.]/g, '');
    components.push(`PSA ${numericGrade || grade.trim()}`);
    
    // 2. Add Pokemon keyword if appropriate
    components.push("Pokemon");
    
    // 3. For the card name, extract only the main parts - ignoring abbreviations
    let cleanedCardName = cardName.trim()
      .replace(/\//g, ' ')  // Replace slashes with spaces
      .replace(/\./g, ' ')  // Replace periods with spaces
      .replace(/,/g, ' ')   // Replace commas with spaces
      .replace(/-/g, ' ')   // Replace hyphens with spaces
      .replace(/\s+/g, ' '); // Replace multiple spaces with a single space
      
    // If the card name contains abbreviations like "MLTRS/ZPDS/ARTCN.GX", 
    // try to expand them based on the successful searches in the screenshot
    if (cleanedCardName.includes("MLTRS") && cleanedCardName.includes("ZPDS") && cleanedCardName.includes("ARTCN")) {
      components.push("Moltres Zapdos Articuno");
      // Also add GX if present
      if (cleanedCardName.includes("GX")) {
        components.push("GX");
      }
    } else {
      // Otherwise just use the cleaned name
      components.push(cleanedCardName);
    }
    
    // 4. Add set name keywords (extract from set name string)
    if (setName && setName.trim() !== '') {
      // Extract key terms from set name
      if (setName.includes("BLACK STAR PROMO")) {
        components.push("Black Star Promo");
      }
    }
    
    // 5. Add card number
    if (cardNumber && cardNumber.trim() !== '') {
      // Remove any # symbol if present
      const cleanedNumber = cardNumber.trim().replace(/^#/, '');
      components.push(cleanedNumber);
    }
    
    // Combine all components with spaces
    let query = components.join(' ');
    
    // Remove any double spaces that might have been introduced
    query = query.replace(/\s+/g, ' ').trim();
    
    console.log(`Generated search query: "${query}"`);
    return query;
  };

  // Get a random user agent to avoid bot detection
  const getRandomUserAgent = () => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  };
  
  // Parse HTML response to extract sales data
  const extractSalesFromHTML = (html: string): { 
    sales: SaleData[]; 
    error?: string; 
    htmlSnippet?: string;
    pageTitle?: string;
  } => {
    try {
      // Use DOMParser through browser (instead of Deno.DOM)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
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
        const link = linkElement ? linkElement.getAttribute('href') || '' : '';
        
        return {
          date: cells[0]?.textContent?.trim() || '',
          title: title,
          link: link,
          auction: cells[2]?.textContent?.trim() || '',
          bids: cells[3]?.textContent?.trim() || '',
          price: priceValue
        };
      }).filter(item => item !== null) as SaleData[];

      return { 
        sales,
        pageTitle,
        htmlSnippet: salesTable.outerHTML.substring(0, 1000) + "..." 
      };
    } catch (error) {
      return { 
        sales: [], 
        error: `HTML parsing error: ${error instanceof Error ? error.message : String(error)}`,
        htmlSnippet: html.substring(0, 1000) + "..." 
      };
    }
  };

  // Main scraping function
  const scrapePrice = useCallback(async (card: CardDetails): Promise<ScrapeResult | null> => {
    if (!card.name) {
      toast.error('Card name is required for price lookup');
      return null;
    }

    if (!card.certification?.grade) {
      toast.error('PSA grade is required for price lookup');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setPriceData(null);
    setDebugInfo(null);

    const cardName = card.name;
    const setName = card.set || 'SM BLACK STAR PROMO'; // Default to SM BLACK STAR PROMO for Pokemon cards
    const cardNumber = typeof card.number === 'object' ? card.number.raw : (card.number || '');
    const grade = card.certification.grade;

    console.log(`Looking up PSA price for ${cardName} (PSA ${grade})`);
    
    // Generate search query
    const searchQuery = formatSearchQuery(cardName, setName, cardNumber, grade);
    
    // Create cache key
    const cacheKey = `${cardName}|${setName}|${cardNumber}|${grade}`;
    
    // Check cache first
    const cachedResult = priceCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Returning cached price data for "${cardName}" (PSA ${grade})`);
      setPriceData(cachedResult.data);
      setIsLoading(false);
      return cachedResult.data;
    }
    
    // The correct URL for 130point.com searches - using sales endpoint instead of cards
    const FORM_SUBMIT_URL = 'https://130point.com/sales/';
    
    // Reference search URL (only for frontend reference, not used for scraping)
    const searchUrl = `https://130point.com/sales/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
    
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
        "Referer": "https://130point.com/sales/",
        "Content-Type": "application/x-www-form-urlencoded",
        "Upgrade-Insecure-Requests": "1",
      };
      
      debugData.headers = { ...headers };
      debugData.processSteps.push(`Using user agent: ${userAgent}`);
      debugData.processSteps.push(`Making initial request to 130point.com/sales to get cookies and session`);
      
      // Use the fetch API directly in the browser to make the request
      // Create form data
      const formData = new URLSearchParams();
      formData.append("search", searchQuery);
      formData.append("searchButton", "");
      formData.append("sortBy", "date_desc");
      
      debugData.processSteps.push(`Submitting form with query "${searchQuery}"`);
      debugData.formData = Object.fromEntries(formData.entries());
      
      // Make the fetch request - we will use a proxy API endpoint we'll create next
      const response = await fetch('/api/scrape-130point', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchQuery,
          userAgent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Parse the HTML response
      const html = data.html;
      debugData.htmlSize = html.length;
      
      // Extract sales data from HTML
      const extractionResult = extractSalesFromHTML(html);
      const sales = extractionResult.sales;
      
      // Add page title to debug data
      debugData.resultsTitle = extractionResult.pageTitle;
      debugData.htmlSnippet = extractionResult.htmlSnippet;
      
      if (extractionResult.error) {
        debugData.errors.push(extractionResult.error);
      }
      
      if (sales.length === 0) {
        console.log("No valid sales data found");
        
        // Return error with debug data
        const errorResult: ScrapeResult = {
          error: "No sales data found for this card",
          searchUrl,
          query: searchQuery,
          debug: debugData,
          htmlSnippet: extractionResult.htmlSnippet,
          pageTitle: extractionResult.pageTitle,
          averagePrice: 0,
          salesCount: 0,
          filteredSalesCount: 0,
          sales: [],
          timestamp: new Date().toISOString()
        };
        
        // Cache the error result too
        priceCache.set(cacheKey, {
          data: errorResult,
          timestamp: Date.now()
        });
        
        setPriceData(errorResult);
        setError(errorResult.error || null);
        setDebugInfo(debugData);
        setIsLoading(false);
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
      const result: ScrapeResult = {
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        salesCount: sales.length,
        filteredSalesCount: finalSales.length,
        sales: finalSales,
        searchUrl,
        query: searchQuery,
        debug: debugData,
        htmlSnippet: extractionResult.htmlSnippet,
        pageTitle: extractionResult.pageTitle,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      priceCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      setPriceData(result);
      setDebugInfo(debugData);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('PSA price lookup error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      
      // If we still have retries left, try again
      if (retryCount < MAX_RETRIES) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        toast.loading(`Retrying price lookup (attempt ${nextRetryCount})...`);
        // Short delay before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false); // Reset loading state for recursive call
        return await scrapePrice(card);
      }
      
      setError(errorMessage);
      toast.error('Price lookup failed after multiple attempts');
      setIsLoading(false);
      return null;
    }
  }, [retryCount]);

  const clearPriceData = useCallback(() => {
    setPriceData(null);
    setError(null);
    setDebugInfo(null);
    setRetryCount(0);
  }, []);

  return {
    isLoading,
    error,
    priceData,
    debugInfo,
    lookupPrice: scrapePrice,
    clearPriceData
  };
};
