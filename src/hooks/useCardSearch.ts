
import { useState, useEffect, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { isLikelyCardNumber } from '../utils/cardSearchUtils';

// Further reduced debounce timeout for more responsive search
const SEARCH_DEBOUNCE_MS = 50; // Reduced from 100ms to 50ms
const SUGGESTION_DEBOUNCE_MS = 75;

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  // Always keep suggestions hidden - we're disabling the dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Track if a search should be performed automatically
  const [shouldSearch, setShouldSearch] = useState(false);
  
  // Ref to store debounce timer IDs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions } = useSetOptions(
    cardDetails.game,
    cardDetails.categoryId
  );
  
  const { 
    searchResults, 
    isSearching, 
    searchCards, 
    hasMoreResults, 
    loadMoreResults,
    totalResults
  } = useCardSearchQuery();
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    fetchSuggestions,
    recentSearches
  } = useCardSuggestions();

  // Detect potentially abandoned searches (like a card number in the name field)
  const [potentialCardNumber, setPotentialCardNumber] = useState<string | null>(null);

  // Store the last search query to avoid duplicate searches
  const lastSearchRef = useRef<string>('');
  
  // Cache for recent search results to avoid redundant DB queries
  const searchCacheRef = useRef<Map<string, any>>(new Map());

  // Perform search when shouldSearch is true
  useEffect(() => {
    if (shouldSearch) {
      const performSearch = async () => {
        // Create a search signature to check against previous searches
        const searchSignature = `${cardDetails.name}|${cardDetails.number}|${cardDetails.set}|${cardDetails.game}`;
        
        // Check if we have cached results for this signature
        const cachedResult = searchCacheRef.current.get(searchSignature);
        if (cachedResult) {
          console.log('Using cached search results for:', searchSignature);
          // Handle cached results (this would need proper implementation)
          // For now, we'll still search but could optimize this further
        }
        
        if (searchSignature !== lastSearchRef.current) {
          lastSearchRef.current = searchSignature;
          
          console.log('Executing search with criteria:', {
            name: cardDetails.name,
            number: cardDetails.number,
            set: cardDetails.set,
            game: cardDetails.game,
            categoryId: cardDetails.categoryId
          });
          
          // Search cards and get set IDs from results
          const foundSetIds = await searchCards(cardDetails, setOptions);
          
          // Filter set options based on search results
          const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
          filterSetOptions(searchTerms, foundSetIds);
        }
        
        setShouldSearch(false);
      };
      
      performSearch();
    }
  }, [shouldSearch, cardDetails, searchCards, setOptions, filterSetOptions]);

  // Modified search behavior: immediate search as user types with even fewer characters
  useEffect(() => {
    // Clear previous suggestion debounce
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    // Still fetch suggestions for historical data, but don't show the dropdown
    if (cardDetails.name && cardDetails.name.length >= 1) {
      suggestionDebounceRef.current = setTimeout(() => {
        // Make sure categoryId is provided and is a number
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
        
        // Check if input might be a card number
        if (isLikelyCardNumber(cardDetails.name) && !cardDetails.number) {
          setPotentialCardNumber(cardDetails.name.trim());
        } else {
          setPotentialCardNumber(null);
        }
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      // If name is cleared, reset potential card number
      setPotentialCardNumber(null);
    }
    
    // Clear previous search debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Start search with just 1 character
    if ((cardDetails.name && cardDetails.name.length >= 1) || cardDetails.number || cardDetails.set) {
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
  }, [cardDetails.name, cardDetails.number, cardDetails.set, cardDetails.game, cardDetails.categoryId, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'game') {
      const gameOption = GAME_OPTIONS.find(option => option.value === value as GameType);
      setCardDetails(prev => ({
        ...prev,
        game: value as GameType,
        categoryId: gameOption?.categoryId,
        set: ''
      }));
      
      // Trigger search immediately when game changes
      setTimeout(() => setShouldSearch(true), 50);
    } else if (name === 'name') {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Reset set selection if name is cleared
      if (!value) {
        setCardDetails(prev => ({ ...prev, set: '', name: '', number: '' }));
        setPotentialCardNumber(null);
      }
    } else if (name === 'set') {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Trigger search immediately when set changes
      setTimeout(() => setShouldSearch(true), 50);
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Also trigger search for other fields like number
      if (name === 'number' && value) {
        setTimeout(() => setShouldSearch(true), 50);
      }
    }
  };

  // Use potential card number as actual card number
  const handleUseAsCardNumber = useCallback(() => {
    if (!potentialCardNumber) return;
    
    setCardDetails(prev => ({
      ...prev,
      name: '',
      number: potentialCardNumber
    }));
    setPotentialCardNumber(null);
    
    // Focus back on the name input for better UX
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Trigger search immediately
    setTimeout(() => setShouldSearch(true), 50);
  }, [potentialCardNumber]);

  // Perform a manual search (kept for compatibility but less needed now)
  const performSearch = useCallback(() => {
    console.log("Manual search triggered with:", cardDetails);
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      setShouldSearch(true);
    }
  }, [cardDetails]);

  const resetSearch = useCallback(() => {
    setCardDetails(prev => ({
      name: '',
      set: '',
      number: '',
      game: prev.game,
      categoryId: prev.categoryId
    }));
    setShowSuggestions(false);
    setPotentialCardNumber(null);
  }, []);

  return {
    cardDetails,
    searchResults,
    setOptions: filteredSetOptions,
    isLoadingSets,
    isSearching,
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    setShowSuggestions,
    searchHistory: recentSearches,
    potentialCardNumber,
    handleInputChange,
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    handleUseAsCardNumber,
    performSearch
  };
};
