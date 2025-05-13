
import { useState, Dispatch, SetStateAction } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../../utils/searchQueryBuilder';
import { toast } from 'react-hot-toast';

// Debug mode flag
const DEBUG_MODE = true;

export const useSearchPagination = (
  searchResults: CardDetails[],
  setSearchResults: Dispatch<SetStateAction<CardDetails[]>>,
  lastSearchParams: {
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more results (for infinite scrolling)
  const loadMoreResults = async () => {
    if (!lastSearchParams.cardDetails || !hasMoreResults || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    
    if (DEBUG_MODE) {
      console.log(`📜 Loading more results - page ${nextPage + 1}`);
    }
    
    try {
      // Build query for the next page using the utility function
      const { query } = await buildSearchQuery(
        lastSearchParams.cardDetails,
        lastSearchParams.setOptions,
        nextPage
      );

      // Execute query
      const { data, error } = await query;

      if (error) {
        console.error('Error loading more results:', error);
        toast.error(`Failed to load more results: ${error.message}`);
        throw error;
      }

      // Format and append new results
      const newCards = formatResultsToCardDetails(
        data || [], 
        lastSearchParams.setOptions,
        lastSearchParams.cardDetails
      );

      if (DEBUG_MODE) {
        console.log(`Loaded ${newCards.length} additional results`);
      }

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
    totalResults,
    setTotalResults,
    loadMoreResults,
    isLoadingMore
  };
};
