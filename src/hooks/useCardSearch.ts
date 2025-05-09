import { useState, useEffect, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { isLikelyCardNumber } from '../utils/cardSearchUtils';
import toast from 'react-hot-toast';

// Debounce timeout duration for search
const SEARCH_DEBOUNCE_MS = 500;
const SUGGESTION_DEBOUNCE_MS = 300;

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
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
    addToRecentSearches,
    recentSearches,
    clearRecentSearches
  } = useCardSuggestions();

  // Detect potentially abandoned searches (like a card number in the name field)
  const [potentialCardNumber, setPotentialCardNumber] = useState<string | null>(null);

  // Store the last search query to avoid duplicate searches
  const lastSearchRef = useRef<string>('');

  // Perform search when shouldSearch is true
  useEffect(() => {
    if (shouldSearch) {
      const performSearch = async () => {
        // Create a search signature to check against previous searches
        const searchSignature = `${cardDetails.name}|${cardDetails.number}|${cardDetails.set}|${cardDetails.game}`;
        
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

          // Add to search history if it's a meaningful search
          if (cardDetails.name && cardDetails.name.length >= 3) {
            addToRecentSearches(cardDetails.name);
          }
        }
        
        setShouldSearch(false);
      };
      
      performSearch();
    }
  }, [shouldSearch, cardDetails, searchCards, setOptions, filterSetOptions, addToRecentSearches]);

  // Debounced search for card suggestions and automatic search
  useEffect(() => {
    // Clear previous suggestion debounce
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    // For suggestions, shorter debounce time
    if (cardDetails.name && cardDetails.name.length >= 2) {
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
    
    // Only perform full search if name has 3+ characters or if number/set is specified
    if ((cardDetails.name && cardDetails.name.length >= 3) || cardDetails.number || cardDetails.set) {
      searchDebounceRef.current = setTimeout(() => {
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
    } else if (name === 'name') {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      setShowSuggestions(value.length >= 2);
      
      // Reset set selection if name is cleared
      if (!value) {
        setCardDetails(prev => ({ ...prev, set: '', name: '', number: '' }));
        setShowSuggestions(false);
        setPotentialCardNumber(null);
      }
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
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
  }, [potentialCardNumber]);

  // Handle selection of a suggestion with immediate search
  const selectSuggestion = useCallback((suggestion: CardDetails) => {
    console.log('Selected suggestion:', suggestion);
    
    // Update card details with selected suggestion
    setCardDetails(prev => ({
      ...prev,
      name: suggestion.name,
      productId: suggestion.productId,
      number: suggestion.number || prev.number,
      // If suggestion has an image URL, keep it for reference
      imageUrl: suggestion.imageUrl || prev.imageUrl
    }));
    
    // Hide suggestions
    setShowSuggestions(false);
    
    // Trigger a search immediately with the selected suggestion
    setShouldSearch(true);
    
    // Add to search history
    if (suggestion.name && suggestion.name.length >= 3) {
      addToRecentSearches(suggestion.name);
    }
    
    // Show a toast notification
    toast.success(`Searching for ${suggestion.name}`);
  }, [addToRecentSearches]);

  // Select history item and search
  const selectHistoryItem = useCallback((item: string) => {
    setCardDetails(prev => ({
      ...prev,
      name: item,
      number: '' // Clear number field when selecting from history
    }));
    
    // Focus the search input after selecting history item
    if (searchInputRef.current) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, []);

  // Perform a manual search (e.g., from a search button)
  const performSearch = useCallback(() => {
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
    selectSuggestion,
    selectHistoryItem,
    clearSearchHistory: clearRecentSearches,
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    handleUseAsCardNumber,
    performSearch
  };
};
