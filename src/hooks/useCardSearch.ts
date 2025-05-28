
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { useSearchState } from './card-search/hooks/useSearchState';
import { useInputHandlers } from './card-search/hooks/useInputHandlers';
import { useSearchActions } from './card-search/hooks/useSearchActions';
import { useSearchEffects } from './card-search/hooks/useSearchEffects';
import { useSearchLogic } from './card-search/hooks/useSearchLogic';

export const useCardSearch = () => {
  // State management
  const {
    cardDetails,
    setCardDetails,
    cardType,
    setCardType,
    showSuggestions,
    setShowSuggestions,
    searchInputRef,
    searchDebounceRef,
    suggestionDebounceRef,
    previousCardNameRef,
    isSetFiltered,
    setIsSetFiltered,
    potentialCardNumber,
    setPotentialCardNumber,
    lastSearchRef,
    searchCacheRef
  } = useSearchState();

  // External hooks
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

  // Search logic
  const { createSearchSignature, performActualSearch } = useSearchLogic({
    searchCards,
    setOptions,
    filterSetOptions,
    isFiltered,
    createSearchSignature: () => '', // This will be overridden
    setSearchResults,
    lastSearchRef,
    searchCacheRef,
    setIsSetFiltered
  });

  // Input handlers
  const { handleInputChange } = useInputHandlers({
    setCardDetails,
    previousCardNameRef,
    setPotentialCardNumber
  });

  // Search actions
  const {
    handleUseAsCardNumber,
    performSearch,
    handleShowAllSets,
    resetSearch,
    clearSearchResults
  } = useSearchActions({
    setCardDetails,
    potentialCardNumber,
    setPotentialCardNumber,
    searchInputRef,
    performActualSearch,
    cardDetails,
    setShowSuggestions,
    setIsSetFiltered,
    lastSearchRef,
    searchCacheRef,
    previousCardNameRef,
    setSearchResults,
    showAllSets
  });

  // Effects
  useSearchEffects({
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
  });

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
