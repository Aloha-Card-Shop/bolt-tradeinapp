
import { supabase } from '../../lib/supabase';
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { RESULTS_PER_PAGE, SearchParams } from './types';
import { formatResultsToCardDetails } from './resultFormatter';

/**
 * Build a complete search query based on card details and set options
 * @param cardDetails Card details to search for
 * @param setOptions Available set options
 * @param page Page number (0-based)
 * @returns Query object and set of found set IDs
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number = 0
) => {
  // Extract search parameters from card details
  const searchParams: SearchParams = {
    name: cardDetails.name,
    set: cardDetails.set,
    cardNumber: cardDetails.number,
    game: cardDetails.game
  };
  
  // Build filter string using the queryBuilder
  const filterString = buildSearchQueryFilter(searchParams);
  
  // Get sort options
  const sortOptions = buildSearchSortOptions(searchParams);
  
  // Calculate pagination
  const from = page * RESULTS_PER_PAGE;
  const to = from + RESULTS_PER_PAGE - 1;
  
  // Set found set IDs
  const foundSetIds = new Set<number>();
  
  // Build and execute query
  const query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' })
    .order(sortOptions.column, { ascending: sortOptions.ascending })
    .range(from, to);
  
  // Add filter if one exists
  if (filterString) {
    query.filter(filterString);
  }
  
  // Return query and found set IDs
  return {
    query,
    foundSetIds
  };
};

/**
 * Execute search query and format results
 * @param cardDetails Card details for search criteria
 * @param setOptions Available set options
 * @param page Page number for pagination
 * @returns Formatted search results
 */
export const formatResultsToCardDetails = (
  data: any[],
  setOptions: SetOption[],
  cardDetails: CardDetails
) => {
  // This is imported from resultFormatter.ts, so we don't need to implement it here
  return data.map(item => ({
    ...item,
    // Add any additional formatting here if needed
  }));
};
