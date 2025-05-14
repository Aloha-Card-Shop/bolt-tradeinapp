
import { useEffect } from 'react';
import { CardDetails } from '../../types/card';

/**
 * Custom hook to handle search debouncing and auto-search triggers
 */
export const useSearchDebouncing = (
  cardDetails: CardDetails,
  setShouldSearch: (value: boolean) => void,
  fetchSuggestions: (name: string, game: string, categoryId: number) => void,
  filterSetOptions: (searchTerms: string[], foundSetIds: Set<number>) => void
) => {
  // Handle card name changes - debounce search
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    if (cardDetails.name && cardDetails.name.length >= 2) {
      // Auto search after typing
      debounceTimeout = setTimeout(() => {
        console.log('Auto-searching after name input:', cardDetails.name);
        setShouldSearch(true);
        
        // Also fetch suggestions after typing
        if (cardDetails.game) {
          fetchSuggestions(cardDetails.name, cardDetails.game, cardDetails.categoryId || 0);
        }
      }, 500); // 500ms debounce for normal searches
    } else if (cardDetails.name === '') {
      // Clear search when name is cleared
      debounceTimeout = setTimeout(() => {
        console.log('Clearing search results as name is empty');
        setShouldSearch(true);
      }, 100);
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [
    cardDetails.name, 
    cardDetails.game, 
    cardDetails.categoryId, 
    setShouldSearch,
    fetchSuggestions
  ]);

  // Handle card number changes
  useEffect(() => {
    if (!cardDetails.number) return;

    // When a card number is entered, search immediately
    const debounceTimeout = setTimeout(() => {
      console.log('Auto-searching after card number input:', cardDetails.number);
      setShouldSearch(true);
    }, 300); // Shorter debounce for card number searches

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [cardDetails.number, setShouldSearch]);

  // Handle set changes
  useEffect(() => {
    if (!cardDetails.set) return;

    // When a set is selected, search immediately
    const debounceTimeout = setTimeout(() => {
      console.log('Auto-searching after set selection:', cardDetails.set);
      setShouldSearch(true);
    }, 100); // Very short debounce for set selection

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [cardDetails.set, setShouldSearch]);
};
