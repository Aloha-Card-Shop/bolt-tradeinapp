
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CardDetails, CardNumberObject } from '../types/card';
import { SetOption } from './useSetOptions';
import { createSearchFilters, formatCardNumberForSearch, extractNumberBeforeSlash } from '../utils/cardSearchUtils';

// Number of results to fetch per page
const RESULTS_PER_PAGE = 15;

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
      // Build query
      const { query, foundSetIds } = await buildSearchQuery(cardDetails, setOptions, 0);

      // Execute query with pagination
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

      // Important: Convert the search results to CardDetails objects
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
      // Build query for the next page
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

  // Helper function to build search query
  const buildSearchQuery = async (
    cardDetails: CardDetails,
    setOptions: SetOption[],
    page: number
  ) => {
    let query = supabase
      .from('unified_products')
      .select('*', { count: 'exact' })
      .eq('category_id', cardDetails.categoryId as number);

    // Add set filter if specified
    if (cardDetails.set) {
      const setOption = setOptions.find(s => s.name === cardDetails.set);
      if (setOption) {
        query = query.eq('group_id', setOption.id);
      }
    }

    // Split search terms and create individual filters
    const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
    
    const foundSetIds = new Set<number>();
    
    if (searchTerms.length > 0 || cardDetails.number) {
      // Format card number for search if provided
      const formattedNumber = cardDetails.number ? 
        formatCardNumberForSearch(cardDetails.number) : undefined;
      
      // Also get the number before the slash for additional searching
      const numberBeforeSlash = cardDetails.number ?
        extractNumberBeforeSlash(cardDetails.number) : undefined;
      
      // Check if the user entered just a number in the name field (might be looking for a card number)
      const possibleCardNumberInName = searchTerms.length === 1 && /^\d+$/.test(searchTerms[0]);
      
      // Create filters for the query
      let filters = createSearchFilters(searchTerms, formattedNumber);
      
      // Add specific filter for searching by number before slash if applicable
      if (numberBeforeSlash && numberBeforeSlash !== formattedNumber) {
        const slashFilters = [
          `attributes->>'card_number'.ilike.${numberBeforeSlash}/%`,
          `attributes->>'Number'.ilike.${numberBeforeSlash}/%`
        ];
        filters.push(`or(${slashFilters.join(',')})`);
      }
      
      // If user entered just a number in name field, also search as a card number
      if (possibleCardNumberInName) {
        const nameAsNumberFilters = [
          `attributes->>'card_number'.ilike.${searchTerms[0]}/%`,
          `attributes->>'Number'.ilike.${searchTerms[0]}/%`
        ];
        filters.push(`or(${nameAsNumberFilters.join(',')})`);
      }
      
      // Combine all filters
      const finalFilter = filters.length > 1 ? `and(${filters.join(',')})` : filters[0];
      
      if (finalFilter) {
        query = query.or(finalFilter);
      }
    }

    // Add pagination
    query = query
      .order('name')
      .range(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE - 1);

    return { query, foundSetIds };
  };

  // Helper function to format API results to CardDetails objects
  const formatResultsToCardDetails = (
    results: any[], 
    setOptions: SetOption[],
    cardDetails: CardDetails
  ): CardDetails[] => {
    return results.map(product => {
      // Extract card number carefully to avoid returning objects
      let cardNumber = '';
      if (product.attributes) {
        const rawCardNumber = product.attributes.card_number || product.attributes.Number || '';
        
        // Handle case when card number is an object with displayName or value
        if (typeof rawCardNumber === 'object' && rawCardNumber !== null) {
          // Type assertion to tell TypeScript that rawCardNumber is a CardNumberObject
          const numberObj = rawCardNumber as CardNumberObject;
          cardNumber = numberObj.displayName || numberObj.value || '';
        } else {
          cardNumber = String(rawCardNumber);
        }
      }
      
      return {
        name: product.name,
        set: product.group_id ? setOptions.find(s => s.id === product.group_id)?.name || '' : '',
        number: cardNumber,
        game: cardDetails.game,
        categoryId: cardDetails.categoryId,
        imageUrl: product.image_url || null,
        productId: product.attributes?.tcgplayer_product_id || product.attributes?.product_id?.toString() || null
      };
    });
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
