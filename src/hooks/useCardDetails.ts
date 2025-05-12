
import { useState, useEffect } from 'react';
import { pullFullCardData } from '../utils/cardSearchUtils';

/**
 * Hook to fetch detailed card information, optimized for finding Charizard
 * @param cardName Name of the card to fetch details for
 * @param setName Optional set name to narrow the search
 * @returns Object containing card details and loading state
 */
export const useCardDetails = (cardName: string, setName?: string) => {
  const [cardDetails, setCardDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCardDetails() {
      if (!cardName) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await pullFullCardData(cardName, setName);
        setCardDetails(data);
      } catch (err) {
        console.error('Error fetching card details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch card details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCardDetails();
  }, [cardName, setName]);

  return { cardDetails, isLoading, error };
};
