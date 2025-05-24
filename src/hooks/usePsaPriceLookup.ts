
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';
import { use130PointScraper } from './use130PointScraper';

export interface PsaPriceData {
  averagePrice: number;
  salesCount: number;
  filteredSalesCount: number;
  searchUrl: string;
  query: string;
  debug?: any; // Debug data
  htmlSnippet?: string; // HTML snippet for debugging
  pageTitle?: string; // Page title for debugging
  timestamp?: string; // Timestamp when the data was fetched
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

  // Use our direct 130point scraper hook
  const { lookupPrice: scrapePrice } = use130PointScraper();

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
      
      // Use the direct scraper instead of the Supabase function
      const result = await scrapePrice(card);
      
      if (!result) {
        setError('No price data available');
        toast.error('Price lookup failed');
        return null;
      }

      if (result.error) {
        setError(result.error);
        
        // Show a more precise error message with debugging details
        if (result.error.includes('No sales data found')) {
          toast.error('No recent sales found for this card and grade');
          console.log('Search query used:', result.query || 'Unknown');
          
          // Log process steps if available
          if (result.debug?.processSteps) {
            console.log('Process steps:', result.debug.processSteps);
          }
          
          // Log errors if available
          if (result.debug?.errors && result.debug.errors.length > 0) {
            console.log('Errors encountered:', result.debug.errors);
          }
        } else {
          toast.error(result.error);
        }
        
        // Still return the debug data even if no prices were found
        setPriceData(result);
        setDebugInfo(result.debug);
        return result;
      }

      console.log('Retrieved PSA price data:', result);
      
      setPriceData(result);
      setDebugInfo(result.debug);
      
      if (result.filteredSalesCount > 0) {
        toast.success(`Found ${result.filteredSalesCount} recent sales for PSA ${card.certification.grade} ${card.name}`);
      } else {
        toast(`No recent sales found, but you can check 130point.com for more info`);
      }
      
      return result;
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
  }, [retryCount, scrapePrice]);

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
