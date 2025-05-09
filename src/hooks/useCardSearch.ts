
import { useState, useEffect, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { isLikelyCardNumber } from '../utils/cardSearchUtils';

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

  // Debounced search for card suggestions and filtering sets
  useEffect(() => {
    // Debounce the search to avoid too many requests
    const timer = setTimeout(async () => {
      // For suggestions, even shorter debounce
      if (cardDetails.name && cardDetails.name.length >= 2) {
        // Make sure categoryId is provided and is a number
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
        
        // Check if input might be a card number
        if (isLikelyCardNumber(cardDetails.name) && !cardDetails.number) {
          setPotentialCardNumber(cardDetails.name.trim());
        } else {
          setPotentialCardNumber(null);
        }
      } else {
        // If name is cleared, reset potential card number
        setPotentialCardNumber(null);
      }
      
      // Get search terms for filtering sets
      const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
      
      // Create a search signature to check against previous searches
      const searchSignature = `${cardDetails.name}|${cardDetails.number}|${cardDetails.set}|${cardDetails.game}`;
      
      // Only perform the search if we have a meaningful query and it's different from the last one
      if ((searchTerms.length > 0 || cardDetails.number || cardDetails.set) && 
          searchSignature !== lastSearchRef.current) {
        
        lastSearchRef.current = searchSignature;
        
        // Search cards and get set IDs from results
        const foundSetIds = await searchCards(cardDetails, setOptions);
        
        // Filter set options based on search results
        filterSetOptions(searchTerms, foundSetIds);

        // Add to search history if it's a meaningful search
        if (cardDetails.name && cardDetails.name.length >= 3) {
          addToRecentSearches(cardDetails.name);
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [cardDetails.name, cardDetails.game, cardDetails.set, cardDetails.number, cardDetails.categoryId, setOptions]);

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

  const selectSuggestion = useCallback((suggestion: CardDetails) => {
    setCardDetails(prev => ({
      ...prev,
      name: suggestion.name,
      productId: suggestion.productId,
      number: suggestion.number || prev.number
    }));
    setShowSuggestions(false);
    
    // Add to search history
    if (suggestion.name && suggestion.name.length >= 3) {
      addToRecentSearches(suggestion.name);
    }
  }, [addToRecentSearches]);

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
    handleUseAsCardNumber
  };
};
