
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

export const useCertificateLookup = () => {
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
  const convertToCardDetails = (): CardDetails | null => {
    if (!result) return null;

    return {
      id: result.certNumber,
      name: result.cardName,
      productId: result.certNumber, // Using cert number as product ID for uniqueness
      game: result.game as GameType, // Cast to GameType since we know the value matches
      set: result.set || 'PSA Certified',
      number: result.cardNumber || '',
      rarity: 'Certified',
      imageUrl: result.imageUrl,
      certification: {
        certNumber: result.certNumber,
        grade: result.grade
      },
      isCertified: true
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCertLookup();
    }
  };

  const clearResult = () => {
    setResult(null);
    setCertNumber('');
  };

  return {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    result,
    handleCertLookup,
    handleKeyDown,
    clearResult,
    certifiedCard: convertToCardDetails()
  };
};
