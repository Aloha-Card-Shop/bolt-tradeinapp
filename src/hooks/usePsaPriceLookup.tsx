
import React from 'react';
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
      soldItems: result.soldItems
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
    soldItems: priceData.soldItems
  } : null;

  return {
    isLoading,
    error,
    priceData: transformedPriceData,
    lookupPsaPrice,
    clearData
  };
};
