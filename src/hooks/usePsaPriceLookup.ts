
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';

export interface PsaPriceData {
  averagePrice: number;
  salesCount: number;
  filteredSalesCount: number;
  searchUrl: string;
  query: string;
  debug?: any; // Debug data
  screenshots?: {
    initialPage?: string;
    filledForm?: string;
    resultsPage?: string;
  };
  sales: Array<{
    date: string;
    title: string;
    link: string;
    auction: string;
    bids: string;
    price: number;
  }>;
}

export const usePsaPriceLookup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PsaPriceData | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Lookup price data for a PSA card
  const lookupPrice = useCallback(async (card: CardDetails) => {
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

    try {
      console.log(`Looking up PSA price for ${card.name} (PSA ${card.certification.grade})`);
      
      // Send detailed card information to the puppeteer-scraper function
      const { data, error: requestError } = await supabase.functions.invoke('playwright-scraper', {
        body: {
          cardName: card.name,
          setName: card.set || 'SM BLACK STAR PROMO', // Default to SM BLACK STAR PROMO for Pokemon cards
          cardNumber: typeof card.number === 'object' ? card.number.raw : card.number || '',
          grade: card.certification.grade
        }
      });

      if (requestError) {
        console.error('PSA price lookup error:', requestError);
        
        // If we still have retries left, try again
        if (retryCount < MAX_RETRIES) {
          const nextRetryCount = retryCount + 1;
          setRetryCount(nextRetryCount);
          toast.loading(`Retrying price lookup (attempt ${nextRetryCount})...`);
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          setIsLoading(false); // Reset loading state for recursive call
          return await lookupPrice(card);
        }
        
        setError(requestError.message || 'Failed to look up price data');
        toast.error('Price lookup failed after multiple attempts');
        return null;
      }

      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0);
      }

      // Store debug info
      if (data?.debug) {
        console.log('Debug information:', data.debug);
        setDebugInfo(data.debug);
      }

      if (!data || data.error) {
        const errorMsg = data?.error || 'No price data available';
        setError(errorMsg);
        
        // Show a more precise error message with debugging details
        if (errorMsg.includes('No sales data found')) {
          toast.error('No recent sales found for this card and grade');
          console.log('Search query used:', data?.query || 'Unknown');
          console.log('Search URL:', data?.searchUrl || 'Unknown');
        } else {
          toast.error(errorMsg);
        }
        
        // Still return the search URL even if no prices were found
        if (data?.searchUrl) {
          const resultData = {
            averagePrice: 0,
            salesCount: 0,
            filteredSalesCount: 0,
            searchUrl: data.searchUrl,
            query: data.query || '',
            debug: data.debug,
            screenshots: data.debug?.screenshots,
            sales: []
          };
          setPriceData(resultData);
          return resultData;
        }
        return null;
      }

      console.log('Retrieved PSA price data:', data);
      
      // Extract screenshots if they exist in debug data
      const screenshots = data.debug?.screenshots || {};
      
      // Add screenshots to the price data
      const enhancedData = {
        ...data,
        screenshots
      };
      
      setPriceData(enhancedData);
      
      if (data.filteredSalesCount > 0) {
        toast.success(`Found ${data.filteredSalesCount} recent sales for PSA ${card.certification.grade} ${card.name}`);
      } else {
        // Using standard toast method instead of toast.info since it doesn't exist
        toast(`No recent sales found, but you can check 130point.com for more info`);
      }
      
      return enhancedData;
    } catch (err: unknown) {
      console.error('PSA price lookup error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
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
        return await lookupPrice(card);
      }
      
      setError(errorMessage);
      toast.error('Price lookup failed after multiple attempts');
      return null;
    } finally {
      setIsLoading(false);
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
    lookupPrice,
    clearPriceData
  };
};
