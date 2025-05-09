
import { useState, useEffect, useRef } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';

// Store search history in localStorage
const SEARCH_HISTORY_KEY = 'card_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions } = useSetOptions(
    cardDetails.game,
    cardDetails.categoryId
  );
  
  const { searchResults, isSearching, searchCards, hasMoreResults, loadMoreResults } = useCardSearchQuery();
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    fetchSuggestions,
    addToRecentSearches
  } = useCardSuggestions();

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse search history:', e);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
      }
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Search for cards and filter sets when search criteria changes
  useEffect(() => {
    // Debounce the search to avoid too many requests
    const timer = setTimeout(async () => {
      // For suggestions, even shorter debounce
      if (cardDetails.name && cardDetails.name.length >= 2) {
        // Make sure categoryId is provided and is a number
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
      }
      
      // Get search terms for filtering sets
      const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
      
      // Only perform the search if we have a meaningful query
      if (searchTerms.length > 0 || cardDetails.number || cardDetails.set) {
        // Search cards and get set IDs from results
        const foundSetIds = await searchCards(cardDetails, setOptions);
        
        // Filter set options based on search results
        filterSetOptions(searchTerms, foundSetIds);

        // Add to search history if it's a meaningful search
        if (cardDetails.name && cardDetails.name.length >= 3 && !searchHistory.includes(cardDetails.name)) {
          addToSearchHistory(cardDetails.name);
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
        setCardDetails(prev => ({ ...prev, set: '', name: '' }));
        setShowSuggestions(false);
      }
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const selectSuggestion = (suggestion: CardDetails) => {
    setCardDetails(prev => ({
      ...prev,
      name: suggestion.name,
      productId: suggestion.productId
    }));
    setShowSuggestions(false);
    
    // Add to search history
    if (suggestion.name && suggestion.name.length >= 3) {
      addToSearchHistory(suggestion.name);
      addToRecentSearches(suggestion.name);
    }
  };

  const selectHistoryItem = (item: string) => {
    setCardDetails(prev => ({
      ...prev,
      name: item
    }));
  };

  const addToSearchHistory = (term: string) => {
    setSearchHistory(prev => {
      // Remove the term if it already exists to avoid duplicates
      const filtered = prev.filter(item => item !== term);
      
      // Add the new term to the beginning
      const updated = [term, ...filtered];
      
      // Limit the number of items
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const resetSearch = () => {
    setCardDetails({
      name: '',
      set: '',
      number: '',
      game: cardDetails.game,
      categoryId: cardDetails.categoryId
    });
    setShowSuggestions(false);
  };

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
    searchHistory,
    handleInputChange,
    selectSuggestion,
    selectHistoryItem,
    clearSearchHistory,
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults
  };
};
