import { useState, useEffect, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { isLikelyCardNumber } from '../utils/cardSearchUtils';
import { toast } from 'react-hot-toast';

// Increased debounce timeouts to reduce race conditions
const SEARCH_DEBOUNCE_MS = 300; // Increased from 200ms
const SUGGESTION_DEBOUNCE_MS = 300; // Increased from 200ms

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  // Add card type state for graded vs raw search mode
  const [cardType, setCardType] = useState<'raw' | 'graded'>('raw');
  
  // Always keep suggestions hidden - we're disabling the dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Ref to store debounce timer IDs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if sets are filtered
  const [isSetFiltered, setIsSetFiltered] = useState(false);
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions, showAllSets, isFiltered, loadSetsByGame } = useSetOptions();
  
  const { 
    searchResults, 
    setSearchResults,
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

  // Load sets when game type changes
  useEffect(() => {
    loadSetsByGame(cardDetails.game);
  }, [cardDetails.game, loadSetsByGame]);

  // Create a memoized search signature to prevent unnecessary re-renders
  const createSearchSignature = useCallback((details: CardDetails) => {
    return `${details.name || ''}|${details.number || ''}|${details.set || ''}|${details.game}`;
  }, []);

  // Perform search function with improved caching and duplicate prevention
  const performActualSearch = useCallback(async (details: CardDetails) => {
    const searchSignature = createSearchSignature(details);
    
    // Check if this is the same as the last search
    if (searchSignature === lastSearchRef.current) {
      console.log('Skipping duplicate search:', searchSignature);
      return;
    }
    
    // Check cache first
    const cachedResult = searchCacheRef.current.get(searchSignature);
    if (cachedResult) {
      console.log('Using cached search results for:', searchSignature);
      setSearchResults(cachedResult.results);
      return;
    }
    
    lastSearchRef.current = searchSignature;
    
    console.log('Executing search with criteria:', {
      name: details.name,
      number: details.number,
      set: details.set,
      game: details.game,
      categoryId: details.categoryId
    });
    
    try {
      // Search cards and get set IDs from results
      const foundSetIds = await searchCards(details, setOptions);
      
      // Convert string array to Set<number> for filterSetOptions
      const searchTerms = (details.name || '').toLowerCase().split(' ').filter(Boolean);
      
      // Create a new Set from the string array, converting strings to numbers
      const setIdSet = new Set<number>();
      foundSetIds.forEach(id => {
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
          setIdSet.add(numericId);
        }
      });
      
      filterSetOptions(searchTerms, setIdSet);
      
      // Record if sets are being filtered
      setIsSetFiltered(isFiltered);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchCards, setOptions, filterSetOptions, isFiltered, createSearchSignature, setSearchResults]);

  // Handle input changes with better validation and proper typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setCardDetails(prev => {
      const newDetails = { ...prev };
      
      if (name === 'game') {
        // Validate game type
        const validGameTypes: GameType[] = ['pokemon', 'japanese-pokemon'];
        const gameType = validGameTypes.includes(value as GameType) ? value as GameType : 'pokemon';
        
        const gameOption = GAME_OPTIONS.find(option => option.value === gameType);
        newDetails.game = gameType;
        newDetails.categoryId = gameOption?.categoryId || GAME_OPTIONS[0].categoryId;
        newDetails.set = ''; // Reset set when game changes
      } else if (name === 'name') {
        newDetails.name = value;
        
        // Check if input might be a card number for name field
        if (isLikelyCardNumber(value) && !newDetails.number) {
          setPotentialCardNumber(value.trim());
        } else {
          setPotentialCardNumber(null);
        }
      } else if (name === 'set') {
        newDetails.set = value;
      } else if (name === 'number') {
        newDetails.number = value;
      }
      
      return newDetails;
    });
  }, []);

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
      lastSearchRef.current = '';
    }
    
    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [cardDetails.name, cardDetails.number, cardDetails.set, cardDetails.game, cardDetails.categoryId, cardType, fetchSuggestions, filterSetOptions, performActualSearch, setSearchResults]);

  // Improved use potential card number function
  const handleUseAsCardNumber = useCallback(() => {
    if (!potentialCardNumber) return;
    
    setCardDetails(prev => ({
      ...prev,
      name: '', // Clear the name field
      number: potentialCardNumber // Move the value to card number field
    }));
    setPotentialCardNumber(null);
    
    // Focus back on the name input for better UX
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [potentialCardNumber]);

  // Perform a manual search
  const performSearch = useCallback(() => {
    console.log("Manual search triggered with:", cardDetails);
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      performActualSearch(cardDetails);
    }
  }, [cardDetails, performActualSearch]);

  // Add new handleShowAllSets function
  const handleShowAllSets = useCallback(() => {
    showAllSets();
    setIsSetFiltered(false);
  }, [showAllSets]);

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
    setIsSetFiltered(false);
    lastSearchRef.current = '';
    searchCacheRef.current.clear();
  }, []);

  // Add a new function to completely clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    resetSearch();
    toast.success('Search results cleared');
  }, [resetSearch, setSearchResults]);

  return {
    cardDetails,
    cardType,
    setCardType,
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
    performSearch,
    handleShowAllSets,
    isSetFiltered,
    clearSearchResults
  };
};
