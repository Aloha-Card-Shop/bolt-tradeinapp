import { useState } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { buildSearchQuery } from '../../utils/search-query';
import { formatResultsToCardDetails } from '../../utils/search-query';
import { 
  logSearchCriteria,
  logPerformance,
  logRawResponse,
  logFormattedResults
} from '../../utils/search-query/debugLogger';
import { getCardNumberString } from '../../utils/card-number/formatters';

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
    
    // Log search criteria with improved card number handling
    if (cardDetails.number) {
      const formattedNumber = getCardNumberString(cardDetails.number);
      console.log(`Searching with card number: ${formattedNumber}`);
    }
    logSearchCriteria(cardDetails, page);
    
    try {
      // Start performance measurement
      const startTime = performance.now();
      
      // Build and execute query using the utility function
      // Now uses the unified_products table
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
        console.error("Search execution error:", error);
        
        // Add specific handling for card number search errors
        if (cardDetails.number && error.message?.includes('operator does not exist')) {
          console.error(`Error with card number search format: ${getCardNumberString(cardDetails.number)}`, error);
          return { 
            results: [], 
            foundSetIds, 
            count: null, 
            error: { 
              ...error, 
              message: 'Card number format error. Try a different format.',
              cardNumber: getCardNumberString(cardDetails.number)
            } 
          };
        }
        
        return { results: [], foundSetIds, count: null, error };
      }

      // If no data was found and it's a card number search, provide a helpful message
      if ((!data || data.length === 0) && cardDetails.number) {
        console.log(`No results found for card number: ${getCardNumberString(cardDetails.number)}`);
        // We don't return an error here as this is a valid state (no results)
        // but we'll log it for debugging
      }

      // Format the search results using the utility function from resultFormatter.ts
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
      
      // More detailed error for card number searches
      if (cardDetails.number && error instanceof Error) {
        console.error(`Error searching with card number '${getCardNumberString(cardDetails.number)}'`, error);
      }
      
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
