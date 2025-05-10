
import { useState } from 'react';
import { CardDetails } from '../types/card';
import { SetOption } from './useSetOptions';
import { buildSearchQuery, formatResultsToCardDetails, RESULTS_PER_PAGE } from '../utils/searchQueryBuilder';
import { toast } from 'react-hot-toast';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;

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
      if (DEBUG_MODE) console.log('Search aborted: No search criteria provided');
      setSearchResults([]);
      setHasMoreResults(false);
      setTotalResults(0);
      return new Set<number>();
    }

    // Reset pagination for new searches
    setCurrentPage(0);
    setIsSearching(true);
    
    // Log search criteria in detail
    if (DEBUG_MODE) {
      console.log('📝 Search initiated with criteria:', {
        name: cardDetails.name || 'not specified',
        number: cardDetails.number || 'not specified',
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
      // Build and execute query using the utility function
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);
      
      if (DEBUG_MODE) {
        console.log('🔍 Executing Supabase query with filters:', {
          categoryId: cardDetails.categoryId,
          name: cardDetails.name ? `%${cardDetails.name}%` : null,
          set: cardDetails.set,
          number: cardDetails.number
        });
      }
      
      const { data, error, count } = await query;

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
        } else {
          console.log('No results returned from query');
        }
      }

      if (error) {
        console.error('Error from Supabase query:', error);
        
        // Improved error messaging based on error codes
        if (error.code === '42703') {
          toast.error(`Database schema error: ${error.message}. Please contact support.`);
        } else {
          toast.error(`Search error: ${error.message || 'Unknown error'}`);
        }
        
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

      // Format the search results using the utility function
      const foundCards = formatResultsToCardDetails(data || [], setOptions, cardDetails);
      
      if (DEBUG_MODE) {
        console.log(`✅ Found ${foundCards.length} formatted card results`);
        if (foundCards.length > 0) {
          console.log('First formatted card:', foundCards[0]);
        }
      }
      
      setSearchResults(foundCards);

      return foundSetIds;
    } catch (error) {
      console.error('❌ Error searching cards:', error);
      
      // Don't show toast for aborted requests
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
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
