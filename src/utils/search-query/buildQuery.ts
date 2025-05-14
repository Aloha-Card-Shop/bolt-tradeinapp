
import { SearchParams } from './types';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { debugLogQuery } from './debugLogger';
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';
import { supabase } from '../../lib/supabase';

/**
 * Build a complete search query for cards using the unified_products table
 * @param cardDetails Card search parameters
 * @param setOptions Available set options
 * @param page Page number for pagination
 * @returns Query and related metadata
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  // Mark setOptions with underscore to indicate it's intentionally unused
  _setOptions: SetOption[],
  page: number = 0
): Promise<{
  query: any;
  foundSetIds: Set<number>;
}> => {
  // Convert CardDetails to SearchParams
  const searchParams: SearchParams = {
    name: cardDetails.name || '',
    set: cardDetails.set || '',
    cardNumber: cardDetails.number,
    game: cardDetails.game,
    sortBy: 'name',
    sortDirection: 'asc',
    page // Include page parameter
  };

  // Build filter string using queryBuilder's implementation
  const filter = buildSearchQueryFilter(searchParams);
  
  // Get sort options using queryBuilder's implementation
  const sort = buildSearchSortOptions(searchParams);

  // Use the filter and sort options to enhance the query
  debugLogQuery(filter, searchParams);

  const RESULTS_PER_PAGE = 40;
  
  // Create a real Supabase query targeting the unified_products table
  const query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' })
    .order(sort.column, { ascending: sort.ascending })
    .range(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE - 1);

  // Apply filter if it exists
  if (filter) {
    query.or(filter);
  }
  
  // Execute the query
  const result = await query;
  
  // Set of found set IDs (for filtering)
  const foundSetIds = new Set<number>();
  
  // Extract group_ids from the results
  if (result.data && result.data.length > 0) {
    result.data.forEach(item => {
      if (item.group_id) {
        foundSetIds.add(item.group_id);
      }
    });
  }
  
  return { 
    query: {
      data: result.data || [],
      error: result.error,
      count: result.count || 0,
      filter,
      sort
    }, 
    foundSetIds 
  };
};
