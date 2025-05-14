
import { useState, Dispatch, SetStateAction } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { RESULTS_PER_PAGE } from '../../utils/search-query/types';
import { toast } from 'react-hot-toast';
import { useSearchExecution } from './useSearchExecution';
import { logLoadingMore, logAdditionalResults } from '../../utils/search-query/debugLogger';

export const useSearchPagination = (
  _searchResults: CardDetails[], // Renamed to indicate it's not used directly
  setSearchResults: Dispatch<SetStateAction<CardDetails[]>>,
  lastSearchParams: {
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Use the search execution hook
  const { executeSearch } = useSearchExecution();

  // Load more results (for infinite scrolling)
  const loadMoreResults = async () => {
    if (!lastSearchParams.cardDetails || !hasMoreResults || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    
    // Log loading more results
    logLoadingMore(nextPage);
    
    try {
      // Execute search for the next page
      const { results: newCards, error } = await executeSearch(
        lastSearchParams.cardDetails,
        lastSearchParams.setOptions,
        nextPage
      );

      if (error) {
        console.error('Error loading more results:', error);
        toast.error(`Failed to load more results: ${error.message}`);
        throw error;
      }

      // Log additional results
      logAdditionalResults(newCards.length);

      // Append new results to existing ones
      setSearchResults(prev => [...prev, ...newCards]);
      setCurrentPage(nextPage);
      
      // Check if there are more results
      setHasMoreResults(newCards.length === RESULTS_PER_PAGE);
      
    } catch (error) {
      console.error('❌ Error loading more results:', error);
      toast.error(`Failed to load more results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    currentPage,
    setCurrentPage,
    hasMoreResults,
    setHasMoreResults,
    loadMoreResults,
    isLoadingMore
  };
};
