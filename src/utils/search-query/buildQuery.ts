
import { SearchParams } from './types';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { debugLogQuery } from './debugLogger';
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';

/**
 * Build a complete search query for cards
 * @param cardDetails Card search parameters
 * @param setOptions Available set options
 * @param page Page number for pagination
 * @returns Query and related metadata
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
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

  // Mock query - in a real application, this would be a database query
  const query = {
    data: [],
    error: null,
    count: 0,
    filter, // Use the filter string
    sort    // Use the sort options
  };

  // Set of found set IDs (for filtering)
  const foundSetIds = new Set<number>();
  
  // In a real implementation, we would use the setOptions parameter
  // to further refine the search or process the results
  
  return { query, foundSetIds };
};
