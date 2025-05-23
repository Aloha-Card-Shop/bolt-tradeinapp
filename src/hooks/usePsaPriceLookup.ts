
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../types/card';

export interface PsaPriceData {
  averagePrice: number;
  salesCount: number;
  filteredSalesCount: number;
  searchUrl: string;
  query: string;
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

  // Helper function to format card name for optimal search
  const formatCardName = (card: CardDetails): string => {
    // Start with the base name
    let formattedName = card.name || '';
    
    // For Pokemon cards with complex names, try to extract the base Pokemon name
    // This helps with searches for cards like "Pikachu V SWSH063"
    if (card.game === 'pokemon') {
      // Extract the base Pokemon name before special card types
      const pokemonNameMatch = formattedName.match(/^(.*?)\s(?:V|GX|EX|VMAX|VSTAR)/i);
      if (pokemonNameMatch) {
        formattedName = pokemonNameMatch[1].trim();
      }
    }
    
    return formattedName;
  };

  // Lookup price data for a PSA card
  const lookupPrice = async (card: CardDetails) => {
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

    try {
      console.log(`Looking up PSA price for ${card.name} (PSA ${card.certification.grade})`);
      
      // Get formatted card name for better search results
      const formattedName = formatCardName(card);
      
      const { data, error } = await supabase.functions.invoke('psa-price-lookup', {
        body: {
          cardName: formattedName,
          setName: card.set || '',
          cardNumber: typeof card.number === 'object' ? card.number.raw : card.number || '',
          grade: card.certification.grade
        }
      });

      if (error) {
        console.error('PSA price lookup error:', error);
        setError(error.message || 'Failed to look up price data');
        toast.error('Price lookup failed');
        return null;
      }

      if (!data || data.error) {
        const errorMsg = data?.error || 'No price data available';
        setError(errorMsg);
        
        // Show a more precise error message
        if (errorMsg.includes('No sales data found')) {
          toast.error('No recent sales found for this card and grade');
        } else {
          toast.error(errorMsg);
        }
        
        // Still return the search URL even if no prices were found
        if (data?.searchUrl) {
          setPriceData({
            averagePrice: 0,
            salesCount: 0,
            filteredSalesCount: 0,
            searchUrl: data.searchUrl,
            query: data.query || '',
            sales: []
          });
          return { searchUrl: data.searchUrl };
        }
        return null;
      }

      console.log('Retrieved PSA price data:', data);
      setPriceData(data);
      
      if (data.filteredSalesCount > 0) {
        toast.success(`Found ${data.filteredSalesCount} recent sales for PSA ${card.certification.grade} ${card.name}`);
      } else {
        // Using standard toast method instead of toast.info since it doesn't exist
        toast(`No recent sales found, but you can check 130point.com for more info`);
      }
      
      return data;
    } catch (err: unknown) {
      console.error('PSA price lookup error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      toast.error('Price lookup failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPriceData = () => {
    setPriceData(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    priceData,
    lookupPrice,
    clearPriceData
  };
};
