
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { CardDetails, GameType } from '../types/card';

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

export const useCertificateLookup = (onCardFound: (card: CardDetails, price: number) => void) => {
  const [certNumber, setCertNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateData | null>(null);

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
      
      // Use cert-lookup function instead of psa-scraper directly
      // This function has better error handling and fallback mechanisms
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
        // More descriptive error message for no data found
        setError('Certificate not found or invalid response. The PSA website might be blocking our request.');
        toast.error('Certificate not found');
        return;
      }

      setResult(data.data);
      toast.success('Certificate found!');
    } catch (err) {
      console.error('Certificate lookup error:', err);
      // More descriptive error message
      let errorMessage = 'An unexpected error occurred';
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      toast.error('Certificate lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTradeIn = () => {
    if (!result) return;
    
    // Convert the certificate result to the format expected by the trade-in functionality
    const cardDetails: CardDetails = {
      id: result.certNumber,
      name: result.cardName,
      productId: result.certNumber, // Using cert number as product ID for uniqueness
      game: result.game as GameType, // Cast to GameType since we know the value matches
      set: result.set || 'Unknown Set',
      number: result.cardNumber || '',
      rarity: 'Certified',
      certification: {
        certNumber: result.certNumber,
        grade: result.grade
      },
      isCertified: true
    };

    // Use a default estimated price based on grade
    const gradeValue = parseFloat(result.grade) || 0;
    let defaultPrice = 0;
    
    if (gradeValue >= 9.5) {
      defaultPrice = 100; // Gem Mint estimate
    } else if (gradeValue >= 9) {
      defaultPrice = 50;  // Mint estimate
    } else if (gradeValue >= 8) {
      defaultPrice = 25;  // Near Mint estimate
    } else {
      defaultPrice = 10;  // Lower grades estimate
    }
    
    onCardFound(cardDetails, defaultPrice);
    toast.success('Added certified card to trade-in list');
    setResult(null);
    setCertNumber('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCertLookup();
    }
  };

  return {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    result,
    handleCertLookup,
    handleAddToTradeIn,
    handleKeyDown
  };
};
