
import { useState } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../../utils/searchQueryBuilder';
import { useSearchPagination } from './useSearchPagination';
import { useSearchErrorHandler } from './useSearchErrorHandler';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }>({
    cardDetails: null,
    setOptions: []
  });

  // Track if any search is in progress to prevent duplicate requests
  const [activeSearchController, setActiveSearchController] = useState<AbortController | null>(null);

  // Import pagination and error handling from separate hooks
  const { 
    currentPage, 
    setCurrentPage, 
    hasMoreResults, 
    setHasMoreResults, 
    totalResults, 
    setTotalResults,
    loadMoreResults
  } = useSearchPagination(searchResults, setSearchResults, lastSearchParams);

  const { 
    searchError, 
    setSearchError, 
    clearError, 
    handleSearchError,
    retrySearch
  } = useSearchErrorHandler(lastSearchParams, searchCards);

  // Optimized search function with faster response and better error handling
  async function searchCards(
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> {
    // Reset error state at the start of a new search
    clearError();
    
    // Quick validation to avoid empty searches
    if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
      if (DEBUG_MODE) console.log('Search aborted: No search criteria provided');
      setSearchResults([]);
      setHasMoreResults(false);
      setTotalResults(0);
      return new Set<number>();
    }

    // Cancel any ongoing search to prevent race conditions
    if (activeSearchController) {
      activeSearchController.abort();
    }

    // Create new abort controller for this search
    const controller = new AbortController();
    setActiveSearchController(controller);

    // Only show loading state if there are no existing results
    // This prevents flickering when refining a search
    if (searchResults.length === 0) {
      setIsSearching(true);
    }
    
    // Reset pagination for new searches
    setCurrentPage(0);
    
    // Log search criteria in detail
    if (DEBUG_MODE) {
      console.log('📝 Search initiated with criteria:', {
        name: cardDetails.name || 'not specified',
        number: cardDetails.number ? 
               (typeof cardDetails.number === 'object' ? 
                JSON.stringify(cardDetails.number) : 
                cardDetails.number) : 'not specified',
        set: cardDetails.set || 'not specified',
        categoryId: cardDetails.categoryId || 'not specified'
      });
    }
    
    // Save search parameters for pagination
    setLastSearchParams({
      cardDetails: { ...cardDetails },
      setOptions: [...setOptions]
    });
    
    try {
      // Start performance measurement
      const startTime = performance.now();
      
      // Build and execute query using the utility function
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);
      
      // Execute query
      const { data, error, count } = await query;

      // End performance measurement
      const endTime = performance.now();
      if (DEBUG_MODE) {
        console.log(`🕒 Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
      }

      // Check if search was aborted
      if (controller.signal.aborted) {
        console.log('Search aborted: User initiated a new search');
        return foundSetIds;
      }

      // Log raw response for debugging
      if (DEBUG_MODE) {
        console.log('📊 Supabase response:', { 
          success: !error, 
          count: count || 'unknown',
          resultCount: data?.length || 0,
          error: error ? `${error.code}: ${error.message}` : null
        });
        
        if (data && data.length > 0) {
          console.log('Sample result item:', data[0]);
        }
      }

      if (error) {
        throw error;
      }

      // Set total count if available
      if (count !== null) {
        setTotalResults(count);
        setHasMoreResults(count > RESULTS_PER_PAGE);
        
        if (DEBUG_MODE) {
          console.log(`Total results: ${count}, showing first ${Math.min(RESULTS_PER_PAGE, count || 0)}`);
        }
      }

      // Extract set IDs from the search results
      const resultSetIds = new Set<number>(foundSetIds);

      // Process the results to get all sets that contain matching cards
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          if (item.group_id) {
            resultSetIds.add(item.group_id);
          }
        });
      }

      // Clear any previous error state on successful search
      clearError();

      // Format the search results using the utility function
      const foundCards = formatResultsToCardDetails(data || [], setOptions, cardDetails);
      
      if (DEBUG_MODE) {
        console.log(`✅ Found ${foundCards.length} formatted card results`);
      }
      
      setSearchResults(foundCards);
      return resultSetIds;
    } catch (error) {
      return handleSearchError(error, controller);
    } finally {
      // Clear the abort controller reference if this is still the active search
      if (activeSearchController === controller && !controller.signal.aborted) {
        setActiveSearchController(null);
      }
      setIsSearching(false);
    }
  }

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
