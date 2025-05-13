
import { supabase } from '../../lib/supabase';
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { RESULTS_PER_PAGE, SearchParams } from './types';
// Remove the import of formatResultsToCardDetails to avoid conflicts

/**
 * Build a complete search query based on card details and set options
 * @param cardDetails Card details to search for
 * @param setOptions Available set options (not used directly in this function but kept for API consistency)
 * @param page Page number (0-based)
 * @returns Query object and set of found set IDs
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  _setOptions: SetOption[], // Renamed with underscore to indicate it's not used
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
  // Fix: Pass the complete searchParams object to the function
  const filterString = buildSearchQueryFilter(searchParams);
  
  // Get sort options
  // Fix: Pass the complete searchParams object to the sortOptions function
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

// This function doesn't need to be here as it's already in resultFormatter.ts
// Removing to resolve the conflict
