
import { useState, useCallback } from 'react';
import { CardDetails } from '../types/card';
import { toast } from 'react-hot-toast';

export const useGradedCardSearch = () => {
  const [gradedResults, setGradedResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add certificate card to graded results
  const addCertificateToResults = useCallback((certificateCard: CardDetails) => {
    console.log('Adding certificate to graded results:', certificateCard);
    
    // Ensure the certificate card has all required fields for display
    const formattedCertificateCard = {
      ...certificateCard,
      id: certificateCard.id || certificateCard.certification?.certNumber || `cert-${Date.now()}`,
      productId: certificateCard.productId || certificateCard.certification?.certNumber,
      isCertified: true,
      game: certificateCard.game || 'pokemon'
    };
    
    setGradedResults(prevResults => {
      // Check if this certificate is already in the results
      const existingIndex = prevResults.findIndex(
        card => card.isCertified && 
               card.certification?.certNumber === formattedCertificateCard.certification?.certNumber
      );
      
      if (existingIndex >= 0) {
        // Replace the existing entry if it exists
        const newResults = [...prevResults];
        newResults[existingIndex] = formattedCertificateCard;
        console.log('Updated existing certificate in graded results');
        return newResults;
      }
      
      // Otherwise add to the beginning
      console.log('Added new certificate to graded results');
      toast.success(`Found certificate: ${formattedCertificateCard.name} (PSA ${formattedCertificateCard.certification?.grade || '?'})`);
      return [formattedCertificateCard, ...prevResults];
    });
  }, []);

  // Remove specific card from graded results
  const removeCardFromResults = useCallback((cardToRemove: CardDetails) => {
    console.log('Removing card from graded results:', cardToRemove);
    
    setGradedResults(prevResults => {
      const newResults = prevResults.filter(card => {
        // Match by certification number if available, otherwise by id
        if (card.certification?.certNumber && cardToRemove.certification?.certNumber) {
          return card.certification.certNumber !== cardToRemove.certification.certNumber;
        }
        return card.id !== cardToRemove.id;
      });
      
      toast.success(`Removed ${cardToRemove.name} from graded results`);
      return newResults;
    });
  }, []);

  // Clear graded results
  const clearGradedResults = useCallback(() => {
    setGradedResults([]);
    toast.success('Graded card results cleared');
  }, []);

  // Set loading state (can be used by certificate lookup)
  const setGradedSearchLoading = useCallback((loading: boolean) => {
    setIsSearching(loading);
  }, []);

  return {
    gradedResults,
    isSearching,
    addCertificateToResults,
    removeCardFromResults,
    clearGradedResults,
    setGradedSearchLoading
  };
};
