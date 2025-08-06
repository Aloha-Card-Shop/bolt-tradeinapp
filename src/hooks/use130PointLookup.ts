import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';
import { FirecrawlService } from '../utils/FirecrawlService';

export interface Sale130Point {
  date: string;
  title: string;
  price: number;
  auction: string;
  bids: string;
}

export interface Data130Point {
  averagePrice: number;
  salesCount: number;
  sales: Sale130Point[];
  searchUrl: string;
  query: string;
  error?: string;
}

// Cache for storing price data
const cache130Point = new Map<string, { data: Data130Point; timestamp: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export const use130PointLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<Data130Point | null>(null);

  const lookup130PointPrice = useCallback(async (card: CardDetails): Promise<Data130Point | null> => {
    if (!card.name) {
      toast.error('Card name is required for 130point lookup');
      return null;
    }

    if (!card.certification?.grade) {
      toast.error('PSA grade is required for 130point lookup');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setPriceData(null);

    const cardName = card.name;
    const setName = card.set || 'Pokemon';
    const cardNumber = typeof card.number === 'object' ? card.number.raw : (card.number || '');
    const grade = card.certification.grade;

    console.log(`Looking up 130point price for ${cardName} (PSA ${grade})`);
    
    // Create cache key
    const cacheKey = `${setName}|${cardName}|${cardNumber}|${grade}`;
    
    // Check cache first
    const cachedResult = cache130Point.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Returning cached 130point data for "${cardName}" (PSA ${grade})`);
      setPriceData(cachedResult.data);
      setIsLoading(false);
      return cachedResult.data;
    }

    try {
      // Use Firecrawl to scrape 130point sales data
      const firecrawlResult = await FirecrawlService.scrape130PointSales(
        cardName,
        setName,
        cardNumber,
        grade
      );

      if (!firecrawlResult.success) {
        throw new Error(`130point lookup failed: ${firecrawlResult.error}`);
      }

      // Type guard to ensure we have the right data structure  
      if ('averagePrice' in firecrawlResult.data) {
        const data130Point = firecrawlResult.data;
        
        // Prepare the result
        const result: Data130Point = {
          averagePrice: data130Point.averagePrice || 0,
          salesCount: data130Point.salesCount || 0,
          sales: 'sales' in data130Point ? data130Point.sales : [],
          searchUrl: data130Point.searchUrl || '',
          query: 'query' in data130Point ? data130Point.query : `${cardName} ${setName} ${cardNumber} PSA ${grade}`
        };

        // Cache the result
        cache130Point.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        setPriceData(result);
        setIsLoading(false);

        if (result.salesCount > 0) {
          toast.success(`Found ${result.salesCount} sales on 130point`);
        } else {
          toast(`No sales found on 130point for this card.`, {
            duration: 6000,
          });
        }

        return result;
      } else {
        throw new Error('Invalid response format from 130point lookup');
      }

    } catch (err) {
      console.error("Error fetching 130point data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch 130point data";
      
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
    lookup130PointPrice,
    clearPriceData
  };
};