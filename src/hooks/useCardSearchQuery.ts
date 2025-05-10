
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

  // Optimized search function with faster response and better error handling
  const searchCards = async (
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> => {
    // Quick validation to avoid empty searches
    if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
      if (DEBUG_MODE) console.log('Search aborted: No search criteria provided');
      setSearchResults([]);
      setHasMoreResults(false);
      setTotalResults(0);
      return new Set<number>();
    }

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
      // Start performance measurement
      const startTime = performance.now();
      
      // Build and execute query using the utility function
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);
      
      // Execute query with 5-second timeout for better user experience
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 5000)
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
        console.error('Error from Supabase query:', error);
        
        // Better error handling for database schema errors
        if (error.code === '42703') {
          // This is a database schema error (column doesn't exist)
          console.error('Database schema error details:', {
            message: error.message,
            hint: 'Schema mismatch in JSON path expressions',
            details: 'This is being fixed by updating the query builder'
          });
          
          toast.error('There was a database error. Please try again in a moment.');
          setSearchResults([]);
          return new Set<number>();
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
      
      // Provide more specific error messages for JSON structure issues
      if (error instanceof Error) {
        if (error.message.includes('JSON') || error.message.includes('jsonb')) {
          console.error('JSON parsing error details:', error);
          toast.error('We\'re fixing an issue with the card search. Please try again in a moment.');
        } else if (error.name !== 'AbortError') {
          // Don't show toast for aborted requests
          toast.error(`Search failed: ${error.message}`);
        }
      } else {
        toast.error('Search failed: Unknown error');
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
