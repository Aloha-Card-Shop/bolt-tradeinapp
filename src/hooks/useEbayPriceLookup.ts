
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';
import { supabase } from '../lib/supabase';

export interface EbaySoldItem {
  title: string;
  price: number;
  url: string;
  currency?: string;
  endDate?: string;
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
      // Call the eBay price lookup Edge Function
      const response = await supabase.functions.invoke('psa-ebay-price', {
        body: {
          game: setName,
          card_name: cardName,
          card_number: cardNumber,
          psa_grade: grade
        }
      });

      if (response.error) {
        throw new Error(`eBay API error: ${response.error.message}`);
      }

      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      // Prepare the result with enhanced data
      const result: EbayPriceResult = {
        averagePrice: data.average_price,
        salesCount: data.sales_count,
        searchUrl: data.search_url,
        query: data.query,
        soldItems: data.sold_items || [],
        timestamp: new Date().toISOString(),
        priceRange: data.price_range || { min: 0, max: 0 },
        outliersRemoved: data.outliers_removed || 0,
        calculationMethod: data.calculation_method || 'unknown',
        // Add compatibility fields
        filteredSalesCount: data.sales_count,
        debug: {
          searchQuery: data.query,
          filteredSalesCount: data.sales_count,
          processSteps: [],
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
