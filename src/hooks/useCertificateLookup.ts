
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { CardDetails, GameType } from '../types/card';
import { usePsaPriceLookup } from './usePsaPriceLookup';

export interface CertificateData {
  certNumber: string;
  cardName: string;
  grade: string;
  year?: string;
  set?: string;
  cardNumber?: string;
  imageUrl?: string | null;
  game: string;
}

export const useCertificateLookup = () => {
  const [certNumber, setCertNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateData | null>(null);
  
  // Get the price lookup hook
  const { lookupPrice, priceData, isLoading: isPriceLoading, error: priceError } = usePsaPriceLookup();

  // Keep track of the card with pricing information
  const [certifiedCardWithPrice, setCertifiedCardWithPrice] = useState<CardDetails | null>(null);

  const handleCertLookup = async () => {
    if (!certNumber.trim()) {
      toast.error('Please enter a certificate number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Looking up certificate:', certNumber.trim());
      
      const { data, error } = await supabase.functions.invoke('cert-lookup', {
        body: { certNumber: certNumber.trim() }
      });

      if (error) {
        console.error('Certificate lookup error:', error);
        setError(error.message || 'Failed to look up certificate');
        toast.error('Certificate lookup failed');
        return;
      }

      if (!data || !data.data) {
        setError('Certificate not found or invalid response. The PSA website might be blocking our request.');
        toast.error('Certificate not found');
        return;
      }

      setResult(data.data);
      toast.success('Certificate found!');
      
      // Convert to card details and look up the price automatically
      const cardDetails = convertToCardDetails(data.data);
      if (cardDetails) {
        // Look up price from 130point.com
        await lookupPrice(cardDetails);
      }
    } catch (err: unknown) {
      console.error('Certificate lookup error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      toast.error('Certificate lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert certificate result to a CardDetails object for the search results
  const convertToCardDetails = (certData: CertificateData | undefined): CardDetails | null => {
    if (!certData) return null;

    return {
      id: certData.certNumber,
      name: certData.cardName,
      productId: certData.certNumber, // Using cert number as product ID for uniqueness
      game: certData.game as GameType, // Cast to GameType since we know the value matches
      set: certData.set || 'PSA Certified',
      number: certData.cardNumber || '',
      rarity: 'Certified',
      imageUrl: certData.imageUrl,
      certification: {
        certNumber: certData.certNumber,
        grade: certData.grade
      },
      isCertified: true
    };
  };

  // Update the certified card when we have price data
  useEffect(() => {
    if (result) {
      const card = convertToCardDetails(result);
      if (card) {
        // Add price data if available
        if (priceData) {
          card.lastPrice = priceData.averagePrice;
          card.priceSource = {
            name: '130point.com',
            url: priceData.searchUrl,
            salesCount: priceData.filteredSalesCount,
            foundSales: priceData.salesCount > 0
          };
        }
        setCertifiedCardWithPrice(card);
      }
    }
  }, [result, priceData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCertLookup();
    }
  };

  const clearResult = () => {
    setResult(null);
    setCertNumber('');
    setCertifiedCardWithPrice(null);
  };

  // Filter out "No sales data found" errors from the price lookup
  // This prevents the red box from displaying in the CertificateLookup UI
  // while allowing the certification lookup errors to be shown
  const filteredError = (() => {
    if (!priceError) return error;
    
    // Check if price error contains the "No sales data found" message
    if (typeof priceError === 'string' && 
        (priceError.includes('No sales data found') || 
         priceError.includes('No sales found'))) {
      // Return null to hide this specific error in the UI
      return error; // Keep any cert lookup errors, just filter out price lookup errors
    }
    
    // For all other errors, return both
    return error || priceError;
  })();

  return {
    certNumber,
    setCertNumber,
    isLoading: isLoading || isPriceLoading,
    error: filteredError, // Use the filtered error instead of raw errors
    result,
    handleCertLookup,
    handleKeyDown,
    clearResult,
    // Fix the type mismatch by ensuring we don't pass null when undefined is expected
    certifiedCard: certifiedCardWithPrice || (result ? convertToCardDetails(result) : undefined),
    priceData
  };
};
