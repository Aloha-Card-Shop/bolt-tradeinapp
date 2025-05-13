
import { useState } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../../utils/searchQueryBuilder';
import { getCardNumberString } from '../../utils/cardSearchUtils';
import { useSearchPagination } from './useSearchPagination';
import { useSearchErrorHandler } from './useSearchErrorHandler';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;
// Increased timeout from 5 seconds to 12 seconds to allow for more complex queries
const SEARCH_TIMEOUT_MS = 12000;

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<{
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }>({
    cardDetails: null,
    setOptions: []
  });

  // Track if any search is in progress to prevent duplicate requests
  const [activeSearchController, setActiveSearchController] = useState<AbortController | null>(null);
  
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
  
  // Declare searchCards first to avoid reference issues
  async function searchCards(
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> {
    // Implementation will be added later
    return new Set<number>();
  }
  
  // Use extracted error handling functionality
  const {
    searchError,
    clearError,
    handleSearchError,
    retrySearch
  } = useSearchErrorHandler(lastSearchParams, searchCards);

  // Overwrite with the real implementation
  // Optimized search function with faster response and better error handling
  searchCards = async (
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
    
    // Log search criteria in detail
    if (DEBUG_MODE) {
      // Convert any CardNumberObject to string for logging
      const numberStr = cardDetails.number ? 
                        (typeof cardDetails.number === 'object' ? 
                         getCardNumberString(cardDetails.number) : 
                         cardDetails.number) : 'not specified';
                         
      console.log('📝 Search initiated with criteria:', {
        name: cardDetails.name || 'not specified',
        number: numberStr,
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
      // Now always using unified_products table
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);
      
      // Execute query with improved timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS)
      );
      
      // Race between the query and the timeout
      const { data, error, count } = await Promise.race([
        query,
        timeoutPromise.then(() => { throw new Error('Search timeout'); })
      ]) as any;

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
          if (data[0].attributes) {
            console.log('Sample attributes structure:', data[0].attributes);
          }
        } else {
          console.log('No results returned from query');
        }
      }

      if (error) {
        return handleSearchError(error, controller);
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
        if (DEBUG_MODE) {
          console.log('Extracting set IDs from search results...');
        }

        data.forEach((item: any) => {
          // For unified_products table, use the direct group_id
          if (item.group_id) {
            resultSetIds.add(item.group_id);
            if (DEBUG_MODE) {
              const setName = setOptions.find(s => s.id === item.group_id)?.name;
              console.log(`Found card "${item.name}" in set "${setName}" (ID: ${item.group_id})`);
            }
          }
        });
        
        if (DEBUG_MODE) {
          console.log(`Total unique sets containing search results: ${resultSetIds.size}`);
        }
      }

      // Clear any previous error state on successful search
      clearError();

      // Format the search results using the utility function
      const foundCards = formatResultsToCardDetails(data || [], setOptions, cardDetails);
      
      if (DEBUG_MODE) {
        console.log(`✅ Found ${foundCards.length} formatted card results`);
        if (foundCards.length > 0) {
          console.log('First formatted card:', foundCards[0]);
        }
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
  };

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
