
import { useEffect } from 'react';
import { CardDetails } from '../../types/card';
import { isLikelyCardNumber } from '../../utils/card-number/variants';

/**
 * Custom hook to handle debouncing for search operations
 */
export const useSearchDebouncing = (
  cardDetails: CardDetails,
  setShouldSearch: (value: boolean) => void,
  fetchSuggestions: (name: string, game: string, categoryId: number) => void
) => {
  // Handle card name changes - debounce search
  useEffect(() => {
    // Auto-search when name or number changes
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      // Skip search if name is very short and doesn't look like a card number
      if (cardDetails.name && cardDetails.name.length < 2 && !isLikelyCardNumber(cardDetails.name)) {
        console.log('Name too short and not a card number, skipping search');
        return;
      }

      const timer = setTimeout(() => {
        console.log('Debounce timer completed, triggering search');
        setShouldSearch(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [cardDetails.name, cardDetails.number, cardDetails.set, setShouldSearch]);
  
  // Fetch auto-complete suggestions when name changes
  useEffect(() => {
    if (cardDetails.name && cardDetails.name.length >= 2) {
      // Don't fetch suggestions if the input looks like a card number
      if (!isLikelyCardNumber(cardDetails.name)) {
        fetchSuggestions(
          cardDetails.name,
          cardDetails.game,
          cardDetails.categoryId || 0
        );
      }
    }
  }, [cardDetails.name, cardDetails.game, cardDetails.categoryId, fetchSuggestions]);

  return null;
};
