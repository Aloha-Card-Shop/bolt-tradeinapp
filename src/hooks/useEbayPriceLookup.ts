
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';
import { FirecrawlService } from '../utils/FirecrawlService';

export interface EbaySoldItem {
  title: string;
  price: number;
  url: string;
  currency?: string;
  isOutlier?: boolean;
}

export interface EbayPriceResult {
  averagePrice: number;
  salesCount: number;
  searchUrl: string;
  query: string;
  error?: string;
  soldItems: EbaySoldItem[];
  timestamp?: string;
  priceRange: {
    min: number;
    max: number;
  };
  outliersRemoved: number;
  calculationMethod: string;
  // Add missing properties for compatibility with CertificateLookup
  debug?: {
    searchQuery?: string;
    filterCriteria?: string;
    pageTitle?: string;
    filteredSalesCount?: number;
    processSteps?: string[];
    errors?: string[];
    formSubmitUrl?: string;
  };
  htmlSnippet?: string;
  pageTitle?: string;
  filteredSalesCount?: number;
}

// Cache for storing price data
const priceCache = new Map<string, { data: EbayPriceResult; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export const useEbayPriceLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<EbayPriceResult | null>(null);

  const lookupPrice = useCallback(async (card: CardDetails): Promise<EbayPriceResult | null> => {
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

    const cardName = card.name;
    const setName = card.set || 'Pokemon'; // Default to Pokemon
    const cardNumber = typeof card.number === 'object' ? card.number.raw : (card.number || '');
    const grade = card.certification.grade;

    console.log(`Looking up eBay PSA price for ${cardName} (PSA ${grade}) - Last 5 sales`);
    
    // Create cache key
    const cacheKey = `${setName}|${cardName}|${cardNumber}|${grade}`;
    
    // Check cache first
    const cachedResult = priceCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Returning cached eBay price data for "${cardName}" (PSA ${grade})`);
      setPriceData(cachedResult.data);
      setIsLoading(false);
      return cachedResult.data;
    }

    try {
      // Build search query for eBay
      const searchQuery = `${cardName} ${setName} ${cardNumber} PSA ${grade}`.trim();
      console.log('Looking up eBay price with Firecrawl for:', searchQuery);
      
      // Use Firecrawl to scrape eBay sold listings
      const firecrawlResult = await FirecrawlService.scrapeEbaySoldListings(searchQuery);

      if (!firecrawlResult.success) {
        throw new Error(`eBay lookup failed: ${firecrawlResult.error}`);
      }

      // Type guard to ensure we have the right data structure
      if ('averagePrice' in firecrawlResult.data) {
        const ebayData = firecrawlResult.data;
        
        // Calculate price range from sold items
        const soldItems = 'soldItems' in ebayData ? ebayData.soldItems : [];
        const prices = soldItems?.map((item: any) => item.price).filter((price: number) => price > 0) || [];
        const priceRange = prices.length > 0 
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : { min: 0, max: 0 };

        // Prepare the result with enhanced data
        const result: EbayPriceResult = {
          averagePrice: ebayData.averagePrice || 0,
          salesCount: ebayData.salesCount || 0,
          searchUrl: ebayData.searchUrl || '',
          query: searchQuery,
          soldItems: soldItems || [],
          timestamp: new Date().toISOString(),
          priceRange,
          outliersRemoved: 0,
          calculationMethod: 'firecrawl-scraping',
          // Add compatibility fields
          filteredSalesCount: ebayData.salesCount || 0,
          debug: {
            searchQuery: searchQuery,
            filteredSalesCount: ebayData.salesCount || 0,
            processSteps: ['Firecrawl eBay scraping'],
            errors: []
          },
          pageTitle: undefined,
          htmlSnippet: undefined
        };

        // Cache the result
        priceCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        setPriceData(result);
        setIsLoading(false);

        if (result.salesCount > 0) {
          toast.success(`Found ${result.salesCount} recent sold items on eBay`);
        } else {
          toast(`No sold items found on eBay. Try the search link for manual checking.`, {
            duration: 6000,
          });
        }

        return result;
      } else {
        throw new Error('Invalid response format from eBay lookup');
      }

    } catch (err) {
      console.error("Error fetching eBay price data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch eBay price data";
      
      setError(errorMessage);
      setIsLoading(false);
      
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const clearPriceData = useCallback(() => {
    setPriceData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    priceData,
    lookupPrice,
    clearPriceData
  };
};
