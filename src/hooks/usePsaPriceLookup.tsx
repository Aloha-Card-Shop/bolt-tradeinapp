
import { useEbayPriceLookup } from './useEbayPriceLookup';
import { CardDetails } from '../types/card';

export interface PsaPriceData {
  averagePrice: number;
  salesCount: number;
  searchUrl: string;
  query: string;
  soldItems?: Array<{
    title: string;
    price: number;
    url: string;
  }>;
  // Add the missing properties that are being used in CertificateLookup
  debug?: {
    searchQuery?: string;
    filterCriteria?: string;
    pageTitle?: string;
    filteredSalesCount?: number;
  };
  htmlSnippet?: string;
  pageTitle?: string;
  timestamp?: string;
  filteredSalesCount?: number;
}

// Adapter hook to maintain compatibility with existing components
export const usePsaPriceLookup = () => {
  const { isLoading, error, priceData, lookupPrice, clearPriceData } = useEbayPriceLookup();

  const lookupPsaPrice = async (card: CardDetails): Promise<PsaPriceData | null> => {
    const result = await lookupPrice(card);
    
    if (!result) return null;

    // Transform eBay result to match expected PSA price data format
    return {
      averagePrice: result.averagePrice,
      salesCount: result.salesCount,
      searchUrl: result.searchUrl,
      query: result.query,
      soldItems: result.soldItems,
      timestamp: result.timestamp,
      filteredSalesCount: result.salesCount, // Map salesCount to filteredSalesCount for compatibility
      // Add empty debug and other optional fields for compatibility
      debug: undefined,
      htmlSnippet: undefined,
      pageTitle: undefined
    };
  };

  const clearData = () => {
    clearPriceData();
  };

  // Transform priceData for compatibility
  const transformedPriceData = priceData ? {
    averagePrice: priceData.averagePrice,
    salesCount: priceData.salesCount,
    searchUrl: priceData.searchUrl,
    query: priceData.query,
    soldItems: priceData.soldItems,
    timestamp: priceData.timestamp,
    filteredSalesCount: priceData.salesCount, // Map salesCount to filteredSalesCount
    // Add empty debug and other optional fields for compatibility
    debug: undefined,
    htmlSnippet: undefined,
    pageTitle: undefined
  } : null;

  return {
    isLoading,
    error,
    priceData: transformedPriceData,
    lookupPsaPrice,
    clearData,
    lookupPrice // Add this for compatibility
  };
};
