
import { useEffect } from 'react';
import { CardDetails, GAME_OPTIONS } from '../../../types/card';
import { SEARCH_DEBOUNCE_MS, SUGGESTION_DEBOUNCE_MS } from '../utils/searchConstants';

interface UseSearchEffectsProps {
  cardDetails: CardDetails;
  cardType: 'raw' | 'graded';
  searchDebounceRef: React.MutableRefObject<NodeJS.Timeout | null>;
  suggestionDebounceRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setPotentialCardNumber: React.Dispatch<React.SetStateAction<string | null>>;
  fetchSuggestions: (name: string, game: any, categoryId: number) => void;
  filterSetOptions: (searchTerms: string[], foundSetIds: Set<number>) => void;
  performActualSearch: (details: CardDetails) => Promise<void>;
  setSearchResults: (results: any[]) => void;
  loadSetsByGame: (game: any) => void;
}

export const useSearchEffects = ({
  cardDetails,
  cardType,
  searchDebounceRef,
  suggestionDebounceRef,
  setPotentialCardNumber,
  fetchSuggestions,
  filterSetOptions,
  performActualSearch,
  setSearchResults,
  loadSetsByGame
}: UseSearchEffectsProps) => {

  // Load sets when game type changes
  useEffect(() => {
    loadSetsByGame(cardDetails.game);
  }, [cardDetails.game, loadSetsByGame]);

  // Debounced search effect with better dependency management
  useEffect(() => {
    // Only perform raw card searches when in raw mode
    if (cardType !== 'raw') {
      return;
    }

    // Clear previous timers
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    // Handle suggestions for name field
    if (cardDetails.name && cardDetails.name.length >= 1) {
      suggestionDebounceRef.current = setTimeout(() => {
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      setPotentialCardNumber(null);
    }
    
    // Update set options when no name search is active
    if (!cardDetails.name) {
      const searchTerms: string[] = [];
      filterSetOptions(searchTerms, new Set<number>());
    }
    
    // Determine if we should perform a search
    const hasSearchCriteria = 
      (cardDetails.name && cardDetails.name.length >= 1) || 
      cardDetails.number || 
      cardDetails.set;
      
    if (hasSearchCriteria) {
      searchDebounceRef.current = setTimeout(() => {
        performActualSearch(cardDetails);
      }, SEARCH_DEBOUNCE_MS);
    } else {
      // Clear results if no criteria
      setSearchResults([]);
    }
    
    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [
    cardDetails.name, 
    cardDetails.number, 
    cardDetails.set, 
    cardDetails.game, 
    cardDetails.categoryId, 
    cardType, 
    fetchSuggestions, 
    filterSetOptions, 
    performActualSearch, 
    setSearchResults,
    searchDebounceRef,
    suggestionDebounceRef,
    setPotentialCardNumber
  ]);
};
