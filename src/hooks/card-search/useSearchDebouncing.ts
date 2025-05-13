
import { useRef, useEffect } from 'react';
import { CardDetails } from '../../types/card';

// Increased debounce timeouts to reduce race conditions
const SEARCH_DEBOUNCE_MS = 200;
const SUGGESTION_DEBOUNCE_MS = 200;

/**
 * Custom hook to handle search debouncing
 */
export const useSearchDebouncing = (
  cardDetails: CardDetails,
  setShouldSearch: (value: boolean) => void,
  fetchSuggestions: (name: string, game: string, categoryId: number) => void,
  filterSetOptions: (searchTerms: string[], foundSetIds?: Set<number>) => void
) => {
  // Ref to store debounce timer IDs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous suggestion debounce
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    // Still fetch suggestions for historical data
    if (cardDetails.name && cardDetails.name.length >= 1) {
      suggestionDebounceRef.current = setTimeout(() => {
        // Make sure categoryId is provided and is a number
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
      }, SUGGESTION_DEBOUNCE_MS);
    }
    
    // Clear previous search debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Always update set options to show all sets when no name search is active
    if (!cardDetails.name) {
      const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
      filterSetOptions(searchTerms);
    }
    
    // Start search with any valid criteria, including set-only searches
    const hasSearchCriteria = 
      (cardDetails.name && cardDetails.name.length >= 1) || 
      cardDetails.number || 
      cardDetails.set;
      
    if (hasSearchCriteria) {
      searchDebounceRef.current = setTimeout(() => {
        console.log("Auto-triggering search for:", cardDetails);
        setShouldSearch(true);
      }, SEARCH_DEBOUNCE_MS);
    }
    
    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [cardDetails.name, cardDetails.number, cardDetails.set, cardDetails.game, cardDetails.categoryId, fetchSuggestions, filterSetOptions, setShouldSearch]);
};

// Import this at the top of the file
import { GAME_OPTIONS } from '../../types/card';
