
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';
import { supabase } from '../lib/supabase';

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
  error?: string;
  debug?: any;
  htmlSnippet?: string;
  pageTitle?: string;
  timestamp?: string;
  sales: SaleData[];
  directUrl?: string; // Added for direct 130point link
  manualSearchSuggested?: boolean; // Flag for suggesting manual search
}

// Cache for storing price data
const priceCache = new Map<string, { data: ScrapeResult; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Enhanced browser fingerprinting - more realistic user agents
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
  "Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1"
];

// Common screen resolutions for more realistic fingerprinting
const SCREEN_RESOLUTIONS = [
  "1920x1080", "1366x768", "2560x1440", "1440x900", 
  "1536x864", "1280x720", "3840x2160", "1600x900"
];

// Common browser languages
const BROWSER_LANGUAGES = [
  "en-US,en;q=0.9", "en-GB,en;q=0.9", "es-ES,es;q=0.9,en;q=0.8",
  "fr-FR,fr;q=0.9,en;q=0.8", "de-DE,de;q=0.9,en;q=0.8"
];

// Common color depths
const COLOR_DEPTHS = [24, 30, 48];

// Generate realistic browser fingerprinting data
const generateBrowserFingerprint = () => {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const resolution = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)];
  const [width, height] = resolution.split('x').map(Number);
  const language = BROWSER_LANGUAGES[Math.floor(Math.random() * BROWSER_LANGUAGES.length)];
  const colorDepth = COLOR_DEPTHS[Math.floor(Math.random() * COLOR_DEPTHS.length)];
  
  // Generate a consistent but random browser fingerprint
  const browserFingerprint = {
    userAgent,
    platform: userAgent.includes('Windows') ? 'Win32' : 
              userAgent.includes('Mac') ? 'MacIntel' : 
              userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iPhone' : 'Linux',
    screenWidth: width,
    screenHeight: height,
    colorDepth,
    language,
    timezone: -new Date().getTimezoneOffset() / 60,
    webdriver: false,
    cookiesEnabled: true
  };
  
  return browserFingerprint;
};

export const use130PointScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<ScrapeResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchAttempts, setSearchAttempts] = useState<string[]>([]);

  // Enhanced search query formatter with multiple strategies
  const formatSearchQuery = (cardName: string, setName: string, cardNumber: string, grade: string, strategy = 'standard'): string => {
    // Clean up the inputs for better search results
    const cleanCardName = cardName.trim()
      .replace(/\//g, ' ')
      .replace(/\./g, ' ')
      .replace(/,/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ');
    
    const cleanSetName = setName.trim();
    const cleanCardNumber = cardNumber.trim().replace(/^#/, '');
    const numericGrade = grade.trim().replace(/[^\d\.]/g, '');
    
    // Different search strategies
    switch (strategy) {
      case 'minimal':
        // Just card name and grade, most likely to return something
        return `PSA ${numericGrade} ${cleanCardName}`.trim();
        
      case 'broad':
        // Card and grade with some additional terms
        let broadComponents = [`PSA ${numericGrade}`, "Pokemon", cleanCardName];
        return broadComponents.join(' ').trim();
        
      case 'number-focus':
        // Emphasize card number which works well for certain cards
        let numberComponents = [`PSA ${numericGrade}`, cleanCardName];
        if (cleanCardNumber) numberComponents.push(cleanCardNumber);
        return numberComponents.join(' ').trim();
        
      case 'set-focus':
        // Emphasize set name which works well for certain sets
        let setComponents = [`PSA ${numericGrade}`, cleanCardName];
        
        // Extract meaningful set terms (avoid common generic terms)
        if (cleanSetName && !cleanSetName.match(/^(sm|swsh|base|black star)$/i)) {
          // Pull out meaningful keywords from set name
          const setKeywords = cleanSetName
            .replace(/black star promo/i, 'promo')
            .replace(/promotional/i, 'promo')
            .split(/\s+/)
            .filter(word => word.length > 2 && !['the', 'and', 'set'].includes(word.toLowerCase()));
          
          if (setKeywords.length > 0) {
            setComponents.push(setKeywords.join(' '));
          }
        }
        
        return setComponents.join(' ').trim();
        
      case 'standard':
      default:
        // Our standard comprehensive search strategy
        let components = [];
        
        // Always add PSA and grade first (based on successful manual searches)
        components.push(`PSA ${numericGrade || grade.trim()}`);
        
        // Add Pokemon keyword
        components.push("Pokemon");
        
        // Handle card name
        if (cleanCardName.includes("MLTRS") && cleanCardName.includes("ZPDS") && cleanCardName.includes("ARTCN")) {
          components.push("Moltres Zapdos Articuno");
          if (cleanCardName.includes("GX")) components.push("GX");
        } else {
          components.push(cleanCardName);
        }
        
        // Add set name keywords selectively
        if (cleanSetName) {
          if (cleanSetName.includes("BLACK STAR PROMO")) {
            components.push("Black Star Promo");
          } else if (cleanSetName.includes("SM") || cleanSetName.includes("SWSH")) {
            // Extract the series code
            const seriesMatch = cleanSetName.match(/(SM|SWSH)/i);
            if (seriesMatch) components.push(seriesMatch[0]);
          }
        }
        
        // Add card number if present
        if (cleanCardNumber) {
          components.push(cleanCardNumber);
        }
        
        // Combine and clean
        return components.join(' ').replace(/\s+/g, ' ').trim();
    }
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
          pageTitle.toLowerCase().includes("cloudflare") ||
          pageTitle.toLowerCase().includes("attention required")) {
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

  // Add random delay between requests to appear more human-like
  const addRandomDelay = (min = 500, max = 2000): Promise<void> => {
    const delay = Math.floor(Math.random() * (max - min)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  };

  // Improved scraping function with multiple search strategies
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
    setSearchAttempts([]);

    const cardName = card.name;
    const setName = card.set || 'SM BLACK STAR PROMO'; // Default to SM BLACK STAR PROMO for Pokemon cards
    const cardNumber = typeof card.number === 'object' ? card.number.raw : (card.number || '');
    const grade = card.certification.grade;

    console.log(`Looking up PSA price for ${cardName} (PSA ${grade})`);
    
    // Define search strategies to try in order
    const strategies = ['standard', 'number-focus', 'set-focus', 'broad', 'minimal'];
    
    // Create cache key for the primary search
    const primaryCacheKey = `${cardName}|${setName}|${cardNumber}|${grade}`;
    
    // Check cache first for primary strategy
    const cachedResult = priceCache.get(primaryCacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Returning cached price data for "${cardName}" (PSA ${grade})`);
      setPriceData(cachedResult.data);
      setIsLoading(false);
      return cachedResult.data;
    }
    
    // Initial debug data object
    let debugData: any = {
      cardDetails: { cardName, setName, cardNumber, grade },
      strategies: [],
      errors: [],
      processSteps: []
    };
    
    // Try each strategy until we find sales
    for (const strategy of strategies) {
      try {
        // Generate search query using current strategy
        const searchQuery = formatSearchQuery(cardName, setName, cardNumber, grade, strategy);
        
        // Skip if we've already tried this exact query
        if (searchAttempts.includes(searchQuery)) {
          continue;
        }
        
        // Add to attempts
        setSearchAttempts(prev => [...prev, searchQuery]);
        
        // Reference search URL (for frontend reference)
        const searchUrl = `https://130point.com/sales/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
        
        // Direct URL for users to check manually
        const directUrl = `https://130point.com/sales/?search=${encodeURIComponent(searchQuery)}&searchButton=&sortBy=date_desc`;
        
        // Strategy-specific debug data
        const strategyDebug: any = {
          strategy,
          searchQuery,
          searchUrl,
          directUrl,
          timing: {},
          errors: []
        };
        
        console.log(`Trying search strategy "${strategy}" with query: "${searchQuery}"`);
        debugData.processSteps.push(`Trying search strategy "${strategy}" with query: "${searchQuery}"`);
        
        // Generate realistic browser fingerprint for this request
        const browserFingerprint = generateBrowserFingerprint();
        
        // Add human-like delay between requests
        await addRandomDelay();
        
        // Detailed logging for debugging
        debugData.processSteps.push(`Using fingerprint with UA: ${browserFingerprint.userAgent.substring(0, 30)}...`);
        
        // Call the Supabase Edge Function with enhanced fingerprinting
        const startTime = Date.now();
        const response = await supabase.functions.invoke('scrape-130point', {
          body: {
            searchQuery,
            fingerprint: browserFingerprint,
            strategy
          }
        });
        strategyDebug.timing.totalTime = Date.now() - startTime;
        
        if (response.error) {
          const errorMessage = `Edge function error: ${response.error.message}`;
          strategyDebug.errors.push(errorMessage);
          debugData.errors.push(errorMessage);
          continue; // Try next strategy
        }
        
        const data = response.data;
        
        if (!data || !data.html) {
          const errorMessage = 'No HTML data returned from scraper';
          strategyDebug.errors.push(errorMessage);
          debugData.errors.push(errorMessage);
          continue; // Try next strategy
        }
        
        // Parse the HTML response
        const html = data.html;
        strategyDebug.htmlSize = html.length;
        
        // Extract sales data from HTML
        const extractionResult = extractSalesFromHTML(html);
        const sales = extractionResult.sales;
        
        strategyDebug.pageTitle = extractionResult.pageTitle;
        strategyDebug.htmlSnippet = extractionResult.htmlSnippet;
        
        if (extractionResult.error) {
          strategyDebug.errors.push(extractionResult.error);
        }
        
        debugData.strategies.push(strategyDebug);
        
        // If we found sales, process them
        if (sales.length > 0) {
          console.log(`Found ${sales.length} sales records with strategy "${strategy}"`);
          debugData.processSteps.push(`Found ${sales.length} sales records with strategy "${strategy}"`);
          
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
            directUrl, // Add the direct URL
            query: searchQuery,
            debug: debugData,
            htmlSnippet: extractionResult.htmlSnippet,
            pageTitle: extractionResult.pageTitle,
            timestamp: new Date().toISOString()
          };
          
          // Cache the result using the primary cache key
          priceCache.set(primaryCacheKey, {
            data: result,
            timestamp: Date.now()
          });
          
          setPriceData(result);
          setDebugInfo(debugData);
          setIsLoading(false);
          return result;
        }
        
        console.log(`No sales found with strategy "${strategy}", trying next strategy...`);
        debugData.processSteps.push(`No sales found with strategy "${strategy}", trying next strategy...`);
        
      } catch (err) {
        console.error(`Error with strategy "${strategy}":`, err);
        debugData.errors.push(`Error with strategy "${strategy}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // If we've tried all strategies and found nothing
    console.log("All search strategies exhausted, no sales data found");
    
    // Return error with debug data and direct link to 130point
    const standardQuery = formatSearchQuery(cardName, setName, cardNumber, grade, 'standard');
    const directUrl = `https://130point.com/sales/?search=${encodeURIComponent(standardQuery)}&searchButton=&sortBy=date_desc`;
    
    const errorResult: ScrapeResult = {
      error: "No sales data found for this card with any search strategy",
      searchUrl: `https://130point.com/sales/?search=${encodeURIComponent(standardQuery)}&searchButton=&sortBy=date_desc`,
      directUrl,
      query: standardQuery,
      debug: debugData,
      htmlSnippet: "No HTML to display",
      pageTitle: "No page title",
      averagePrice: 0,
      salesCount: 0,
      filteredSalesCount: 0,
      sales: [],
      timestamp: new Date().toISOString(),
      manualSearchSuggested: true // Indicate that manual search might work
    };
    
    // Cache the error result too
    priceCache.set(primaryCacheKey, {
      data: errorResult,
      timestamp: Date.now()
    });
    
    setPriceData(errorResult);
    setError(errorResult.error || null);
    setDebugInfo(debugData);
    setIsLoading(false);
    
    // Show a more helpful error message with specific suggestion to try manual search
    toast((t) => (
      <div className="space-y-2">
        <p>No sales found through automated search.</p>
        <p className="text-sm text-amber-600">Try searching manually - results may be available!</p>
        <a 
          href={directUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center mt-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Open in 130point.com
        </a>
      </div>
    ), { 
      duration: 8000,
      icon: '🔍'
    });
    
    return errorResult;
  }, [retryCount, searchAttempts]);

  const clearPriceData = useCallback(() => {
    setPriceData(null);
    setError(null);
    setDebugInfo(null);
    setRetryCount(0);
    setSearchAttempts([]);
  }, []);

  return {
    isLoading,
    error,
    priceData,
    debugInfo,
    lookupPrice: scrapePrice,
    clearPriceData,
    searchAttempts
  };
};
