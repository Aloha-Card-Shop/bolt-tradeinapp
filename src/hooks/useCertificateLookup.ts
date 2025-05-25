import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { CardDetails, GameType } from '../types/card';
import { useEbayPriceLookup } from './useEbayPriceLookup';

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
  
  // Get the eBay price lookup hook
  const { lookupPrice, priceData, isLoading: isPriceLoading, error: priceError } = useEbayPriceLookup();

  // Keep track of the card with pricing information
  const [certifiedCardWithPrice, setCertifiedCardWithPrice] = useState<CardDetails | null>(null);

  // Detect game type based on certificate data
  const detectGameType = (certData: CertificateData): GameType => {
    // Default to Pokémon if we can't determine
    if (!certData) return 'pokemon';
    
    const name = certData.cardName.toLowerCase();
    const set = (certData.set || '').toLowerCase();
    
    if (name.includes('magic') || set.includes('magic') || 
        name.includes('mtg') || set.includes('mtg')) {
      return 'magic';
    }
    
    if (name.includes('yugioh') || set.includes('yugioh') || 
        name.includes('yu-gi-oh') || set.includes('yu-gi-oh')) {
      return 'yugioh';
    }
    
    // Look for Pokémon-specific terms
    if (name.includes('pokemon') || set.includes('pokemon') ||
        name.includes('pikachu') || name.includes('charizard') ||
        set.includes('base set') || set.includes('black star') ||
        set.includes('swsh') || set.includes('sun & moon') ||
        set.includes('ex') || set.includes('gx') || set.includes('v ')) {
      return 'pokemon';
    }
    
    // Look for sports card indicators
    if (name.includes('topps') || name.includes('upper deck') ||
        name.includes('panini') || name.includes('bowman') ||
        name.includes('fleer')) {
      return 'sports';
    }
    
    // Default to Pokémon as the most common type
    return 'pokemon';
  };

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
        // Look up price from eBay
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

    // Detect the game type based on certificate data
    const gameType = detectGameType(certData);
    
    // Create a more standardized card number format if available
    let cardNumberValue = certData.cardNumber || '';
    
    // For Pokemon specifically, try to improve the card number format
    if (gameType === 'pokemon' && cardNumberValue) {
      // If we have SM or SWSH promo, format as SM### or SWSH###
      if (certData.set?.toLowerCase().includes('black star promo') || certData.set?.toLowerCase().includes('promotional')) {
        if (cardNumberValue.toLowerCase().includes('sm')) {
          cardNumberValue = cardNumberValue.toUpperCase(); // Ensure uppercase
        } else if (cardNumberValue.toLowerCase().includes('swsh')) {
          cardNumberValue = cardNumberValue.toUpperCase(); // Ensure uppercase
        }
      }
    }

    return {
      id: certData.certNumber,
      name: certData.cardName,
      productId: certData.certNumber, // Using cert number as product ID for uniqueness
      game: gameType,
      set: certData.set || 'PSA Certified',
      number: cardNumberValue,
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
        console.log('eBay price data:', priceData);
        
        // Add price data if available
        if (priceData) {
          card.lastPrice = priceData.averagePrice;
          card.priceSource = {
            name: 'eBay',
            url: priceData.searchUrl,
            salesCount: priceData.salesCount,
            foundSales: priceData.salesCount > 0,
            soldItems: priceData.soldItems || [], // Ensure soldItems is included
            priceRange: priceData.priceRange,
            outliersRemoved: priceData.outliersRemoved,
            calculationMethod: priceData.calculationMethod,
            query: priceData.query
          };
          
          console.log('Card with pricing data:', card);
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
