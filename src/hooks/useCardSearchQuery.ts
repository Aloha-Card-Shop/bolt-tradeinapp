
import { useState } from 'react';
import { CardDetails } from '../types/card';
import { SetOption } from './useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../utils/searchQueryBuilder';

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [lastSearchParams, setLastSearchParams] = useState<{
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  }>({
    cardDetails: null,
    setOptions: []
  });

  // Search for cards based on provided criteria
  const searchCards = async (
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> => {
    if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
      setSearchResults([]);
      setHasMoreResults(false);
      setTotalResults(0);
      return new Set<number>();
    }

    // Reset pagination for new searches
    setCurrentPage(0);
    setIsSearching(true);
    
    // Save search parameters for pagination
    setLastSearchParams({
      cardDetails: { ...cardDetails },
      setOptions: [...setOptions]
    });
    
    try {
      // Build and execute query using the new utility function
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);
      const { data, error, count } = await query;

      if (error) throw error;

      // Set total count if available
      if (count !== null) {
        setTotalResults(count);
        setHasMoreResults(count > RESULTS_PER_PAGE);
      }

      // Log the number of results found
      console.log(`Found ${data?.length || 0} results for card search`, { 
        name: cardDetails.name, 
        number: cardDetails.number,
        set: cardDetails.set
      });

      // Format the search results using the new utility function
      const foundCards = formatResultsToCardDetails(data || [], setOptions, cardDetails);
      setSearchResults(foundCards);

      return foundSetIds;
    } catch (error) {
      console.error('Error searching cards:', error);
      setSearchResults([]);
      setHasMoreResults(false);
      setTotalResults(0);
      return new Set<number>();
    } finally {
      setIsSearching(false);
    }
  };

  // Load more results (for infinite scrolling)
  const loadMoreResults = async () => {
    if (!lastSearchParams.cardDetails || !hasMoreResults) return;
    
    const nextPage = currentPage + 1;
    setIsSearching(true);
    
    try {
      // Build query for the next page using the new utility function
      const { query } = await buildSearchQuery(
        lastSearchParams.cardDetails,
        lastSearchParams.setOptions,
        nextPage
      );

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      // Format and append new results
      const newCards = formatResultsToCardDetails(
        data || [], 
        lastSearchParams.setOptions,
        lastSearchParams.cardDetails
      );

      // Append new results to existing ones
      setSearchResults(prev => [...prev, ...newCards]);
      setCurrentPage(nextPage);
      
      // Check if there are more results
      setHasMoreResults(newCards.length === RESULTS_PER_PAGE);
      
    } catch (error) {
      console.error('Error loading more results:', error);
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
    totalResults
  };
};
