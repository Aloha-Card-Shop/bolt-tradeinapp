
import { useRef, useEffect } from 'react';
import { CardDetails } from '../../types/card';

// Increased debounce timeouts to reduce race conditions
const SEARCH_DEBOUNCE_MS = 300; // Increased from 200ms for better user experience
const SUGGESTION_DEBOUNCE_MS = 300;

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
  
  // Track previous values to detect actual changes
  const prevNameRef = useRef<string>(cardDetails.name || '');
  const prevNumberRef = useRef<string>(cardDetails.number?.toString() || '');
  const prevSetRef = useRef<string>(cardDetails.set || '');

  // Detect if this is the initial effect run
  const isInitialMount = useRef(true);
  
  // Use a dedicated ref for tracking if filter has already been initialized
  const isFilterInitialized = useRef(false);

  useEffect(() => {
    // Only initialize filter once on first mount to avoid repeated filtering with empty terms
    if (!isFilterInitialized.current) {
      if (cardDetails.name?.length) {
        // Only filter if we have a name to search with
        const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
        filterSetOptions(searchTerms);
      }
      isFilterInitialized.current = true;
      return;
    }

    // Skip all other processing on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Determine if there was an actual change in search criteria
    const nameChanged = prevNameRef.current !== (cardDetails.name || '');
    const numberChanged = prevNumberRef.current !== (cardDetails.number?.toString() || '');
    const setChanged = prevSetRef.current !== (cardDetails.set || '');
    
    // Update references for next comparison
    prevNameRef.current = cardDetails.name || '';
    prevNumberRef.current = cardDetails.number?.toString() || '';
    prevSetRef.current = cardDetails.set || '';

    // Only handle suggestions if the name actually changed
    if (nameChanged) {
      // Clear previous suggestion debounce
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      
      // Only fetch suggestions for meaningful input
      if (cardDetails.name && cardDetails.name.length >= 1) {
        suggestionDebounceRef.current = setTimeout(() => {
          // Make sure categoryId is provided and is a number
          const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
          fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
        }, SUGGESTION_DEBOUNCE_MS);
        
        // Only update set options when name changes AND we have search terms
        const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
        if (searchTerms.length > 0) {
          filterSetOptions(searchTerms);
        }
      } else if (!cardDetails.name) {
        // Reset set filtering if name becomes empty
        filterSetOptions([]);
      }
    }
    
    // Clear previous search debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Only trigger search if meaningful changes happened
    if (nameChanged || numberChanged || setChanged) {
      // Start search with any valid criteria, including set-only searches
      const hasSearchCriteria = 
        (cardDetails.name && cardDetails.name.length >= 1) || 
        cardDetails.number || 
        cardDetails.set;
        
      if (hasSearchCriteria) {
        // Only debounce for name changes (typing), immediate search for other criteria
        const debounceTime = nameChanged ? SEARCH_DEBOUNCE_MS : 50;
        
        searchDebounceRef.current = setTimeout(() => {
          console.log(`Auto-triggering search for: ${cardDetails.name || 'empty name'}, number: ${cardDetails.number || 'none'}, set: ${cardDetails.set || 'none'}`);
          setShouldSearch(true);
        }, debounceTime);
      }
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
