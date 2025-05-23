import { useState } from 'react';
import { CardDetails } from '../types/card';
import { SetOption } from './useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../utils/searchQueryBuilder';
import { toast } from 'react-hot-toast';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;
// Increased timeout from 5 seconds to 12 seconds to allow for more complex queries
const SEARCH_TIMEOUT_MS = 12000;

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // Track the current search query string
  const [currentSearchQueryId, setCurrentSearchQueryId] = useState<string | null>(null);

  // Function to add a certification result to the top of search results
  const addCertificationResult = (certCard: CardDetails) => {
    // Add certification result at the top of the list
    setSearchResults(prevResults => {
      // Check if the cert is already in the results
      const exists = prevResults.some(card => 
        card.certification?.certNumber === certCard.certification?.certNumber);
      
      if (exists) {
        return prevResults;
      }
      
      return [certCard, ...prevResults];
    });
  };

  // Main search function
  const searchCards = async (
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<string[]> => {
    // Don't search if no meaningful criteria provided
    if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
      if (DEBUG_MODE) console.log('Skipping search - no criteria provided');
      return [];
    }

    setIsSearching(true);

    try {
      // Generate a unique query identifier
      const queryId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setCurrentSearchQueryId(queryId);

      // Build the search query
      const { query, variables } = buildSearchQuery(cardDetails, 0, RESULTS_PER_PAGE);
      
      if (DEBUG_MODE) {
        console.log('Executing search query:', { query, variables });
      }

      // Execute the search query with a timeout
      const searchPromise = fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT_MS);
      });

      // Race the search against the timeout
      const response = await Promise.race([searchPromise, timeoutPromise]) as Response;
      
      // Check if this is still the current search
      if (queryId !== currentSearchQueryId) {
        if (DEBUG_MODE) console.log('Search aborted - newer search in progress');
        return [];
      }

      const result = await response.json();

      if (result.errors) {
        console.error('Search query errors:', result.errors);
        toast.error('Search failed. Please try again.');
        setIsSearching(false);
        return [];
      }

      // Process the search results
      const searchData = result.data?.search;
      const formattedResults = formatResultsToCardDetails(searchData?.results || []);
      
      // Update state with the search results
      setSearchResults(formattedResults);
      setCurrentPage(0);
      setTotalResults(searchData?.total || 0);
      setHasMoreResults(formattedResults.length < (searchData?.total || 0));

      // Extract set IDs from the results for filtering options
      const foundSetIds = formattedResults
        .map(card => card.setId)
        .filter(Boolean) as string[];

      if (DEBUG_MODE) {
        console.log('Search complete:', {
          results: formattedResults.length,
          totalResults: searchData?.total || 0,
          foundSetIds: foundSetIds.length
        });
      }

      return foundSetIds;
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Function to load more results for pagination
  const loadMoreResults = async () => {
    if (isSearching || !hasMoreResults) return;
    
    const nextPage = currentPage + 1;
    setIsSearching(true);
    
    try {
      // We need to reconstruct the last search query with the next page
      // Ideally this would come from a ref that stores the last query details
      // For now, this is a simplified version
      
      // This is where you would reconstruct the query with the next page
      // const { query, variables } = buildSearchQuery(lastSearchCriteria, nextPage, RESULTS_PER_PAGE);
      
      // For the sake of this implementation, we'll skip the actual implementation
      // of loading more results and just show how we would process them
      
      /* 
      // Execute query...
      const response = await fetch('/api/search', {...});
      const result = await response.json();
      
      // Process results
      const searchData = result.data?.search;
      const newResults = formatResultsToCardDetails(searchData?.results || []);
      */
      
      // Update the next page and add new results
      setCurrentPage(nextPage);
      // setSearchResults(prev => [...prev, ...newResults]);
      // setHasMoreResults(prev => prev && newResults.length >= RESULTS_PER_PAGE);
      
    } catch (error) {
      console.error('Load more results error:', error);
      toast.error('Failed to load more results');
    } finally {
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
    addCertificationResult
  };
};
