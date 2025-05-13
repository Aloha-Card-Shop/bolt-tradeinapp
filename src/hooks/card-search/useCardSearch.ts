
import { useCallback, useEffect } from 'react';
import { useSetOptions } from '../useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from '../useCardSuggestions';
import { useCardInput } from './useCardInput';
import { useSearchState } from './useSearchState';
import { useSearchDebouncing } from './useSearchDebouncing';

/**
 * Main card search hook that combines all search functionality
 */
export const useCardSearch = () => {
  const {
    cardDetails,
    searchInputRef,
    potentialCardNumber,
    handleInputChange,
    handleUseAsCardNumber,
    resetSearch
  } = useCardInput();
  
  const {
    shouldSearch,
    setShouldSearch,
    isSetFiltered,
    setIsSetFiltered,
    lastSearchRef,
    searchCacheRef,
    isInitialLoad,
    performSearch: triggerSearch
  } = useSearchState();
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions, showAllSets, isFiltered } = useSetOptions(
    cardDetails.game,
    cardDetails.categoryId
  );
  
  const { 
    searchResults, 
    isSearching, 
    searchCards, 
    hasMoreResults, 
    loadMoreResults,
    totalResults,
    searchError,
    clearError,
    retrySearch
  } = useCardSearchQuery();
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    fetchSuggestions,
    recentSearches
  } = useCardSuggestions();

  // Setup debouncing for searches and suggestions
  useSearchDebouncing(
    cardDetails, 
    setShouldSearch, 
    // Type correction: convert fetchSuggestions to match the expected signature
    (name: string, game: string, categoryId: number) => fetchSuggestions(name, game as any, categoryId),
    filterSetOptions
  );

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
          // We could use the cached results here instead of executing a new search
          // For now we'll just log it and still perform the search
        }
        
        // Skip search if it matches the last query to avoid duplicate searches
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
          
          // Filter set options based on search results, only if we have a name to search
          if (cardDetails.name) {
            const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
            filterSetOptions(searchTerms, foundSetIds);
            
            // Record if sets are being filtered
            setIsSetFiltered(isFiltered);
          }
        }
        
        setShouldSearch(false);
      };
      
      performSearch();
    }
  }, [shouldSearch, cardDetails, searchCards, setOptions, filterSetOptions, isFiltered, setIsSetFiltered, lastSearchRef, searchCacheRef]);

  // Wrapper for performSearch to expose to components
  const performSearch = useCallback(() => {
    // Skip the initial load flag to ensure the search happens when manually triggered
    isInitialLoad.current = false;
    triggerSearch(cardDetails);
  }, [triggerSearch, cardDetails, isInitialLoad]);

  // Add new handleShowAllSets function
  const handleShowAllSets = useCallback(() => {
    showAllSets();
    setIsSetFiltered(false);
  }, [showAllSets, setIsSetFiltered]);

  return {
    cardDetails,
    searchResults,
    setOptions: filteredSetOptions,
    isLoadingSets,
    isSearching,
    suggestions,
    isLoadingSuggestions,
    showSuggestions: false, // Always keep suggestions hidden - we're disabling the dropdown
    setShowSuggestions: () => {}, // Empty function since we don't show suggestions
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
    isSetFiltered,
    handleShowAllSets,
    searchError,
    clearError,
    retrySearch
  };
};

