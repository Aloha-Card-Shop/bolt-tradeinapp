import { useState } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../../utils/search-query';
import { 
  logSearchCriteria,
  logPerformance,
  logRawResponse,
  logFormattedResults
} from '../../utils/search-query/debugLogger';

// Increased timeout for complex queries
const SEARCH_TIMEOUT_MS = 12000;

export const useSearchExecution = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  // Track active search controller to prevent duplicate requests
  const [activeSearchController, setActiveSearchController] = useState<AbortController | null>(null);
  
  // Execute the search query
  const executeSearch = async (
    cardDetails: CardDetails,
    setOptions: SetOption[],
    page: number = 0
  ): Promise<{ 
    results: CardDetails[],
    foundSetIds: Set<number>,
    count: number | null,
    error: any
  }> => {
    // Cancel any ongoing search to prevent race conditions
    if (activeSearchController) {
      activeSearchController.abort();
    }

    // Create new abort controller for this search
    const controller = new AbortController();
    setActiveSearchController(controller);
    
    // Only show loading state if this is a new search (page 0)
    // and there are no existing results
    if (page === 0 && searchResults.length === 0) {
      setIsSearching(true);
    }
    
    // Log search criteria
    logSearchCriteria(cardDetails, page);
    
    try {
      // Start performance measurement
      const startTime = performance.now();
      
      // Build and execute query using the utility function
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, page);
      
      // Execute query with improved timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS)
      );
      
      // Race between the query and the timeout
      const { data, error, count } = await Promise.race([
        query,
        timeoutPromise.then(() => { throw new Error('Search timeout'); })
      ]) as any;

      // Log performance metrics
      logPerformance(startTime);

      // Check if search was aborted
      if (controller.signal.aborted) {
        console.log('Search aborted: User initiated a new search');
        return { results: [], foundSetIds, count: null, error: null };
      }

      // Log raw response
      logRawResponse(data, error, count);

      if (error) {
        return { results: [], foundSetIds, count: null, error };
      }

      // Format the search results using the utility function
      const formattedResults = formatResultsToCardDetails(data || [], setOptions, cardDetails);
      
      // Log formatted results
      logFormattedResults(formattedResults);
      
      // If this is a new search (page 0), replace results
      // Otherwise, if this is pagination, we'll handle appending elsewhere
      if (page === 0) {
        setSearchResults(formattedResults);
      }

      // Update total count
      if (count !== null && page === 0) {
        setTotalResults(count);
      }
      
      return { 
        results: formattedResults, 
        foundSetIds, 
        count, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Error executing search:', error);
      return { results: [], foundSetIds: new Set(), count: null, error };
    } finally {
      // Clear the abort controller reference if this is still the active search
      if (activeSearchController === controller && !controller.signal.aborted) {
        setActiveSearchController(null);
      }
      setIsSearching(false);
    }
  };

  return {
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    totalResults,
    setTotalResults,
    executeSearch,
    activeSearchController
  };
};
