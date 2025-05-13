
import { useState } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { RESULTS_PER_PAGE } from '../../utils/search-query';
import { useSearchPagination } from './useSearchPagination';
import { useSearchErrorHandler } from './useSearchErrorHandler';
import { useSearchExecution } from './useSearchExecution';

// Debug mode flag
const DEBUG_MODE = true;

export const useCardSearchQuery = () => {
  const [lastSearchParams, setLastSearchParams] = useState<{
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }>({
    cardDetails: null,
    setOptions: []
  });

  // Use the extracted search execution functionality
  const { 
    searchResults, 
    setSearchResults,
    isSearching, 
    totalResults,
    executeSearch
  } = useSearchExecution();
  
  // Use extracted pagination functionality
  const { 
    hasMoreResults, 
    setHasMoreResults, 
    loadMoreResults
  } = useSearchPagination(
    searchResults,
    setSearchResults,
    lastSearchParams
  );
  
  // Create the searchCards function
  const searchCards = async (
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> => {
    // Reset error state at the start of a new search
    clearError();
    
    // Quick validation to avoid empty searches
    if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
      if (DEBUG_MODE) console.log('Search aborted: No search criteria provided');
      setSearchResults([]);
      setHasMoreResults(false);
      return new Set<number>();
    }

    // Save search parameters for pagination
    setLastSearchParams({
      cardDetails: { ...cardDetails },
      setOptions: [...setOptions]
    });
    
    // Execute the search
    const { results, foundSetIds, count, error } = await executeSearch(
      cardDetails, 
      setOptions, 
      0 // First page
    );
    
    // Handle errors if any
    if (error) {
      return handleSearchError(error, { abort: () => {}, signal: { aborted: false } } as AbortController);
    }
    
    // Set pagination status
    if (count !== null) {
      setHasMoreResults(count > RESULTS_PER_PAGE);
      
      if (DEBUG_MODE) {
        console.log(`Total results: ${count}, showing first ${Math.min(RESULTS_PER_PAGE, count || 0)}`);
      }
    }

    return foundSetIds;
  };
  
  // Use extracted error handling functionality
  const {
    searchError,
    clearError,
    handleSearchError,
    retrySearch
  } = useSearchErrorHandler(lastSearchParams, searchCards);

  return {
    searchResults,
    isSearching,
    searchCards,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    searchError,
    clearError,
    retrySearch
  };
};
