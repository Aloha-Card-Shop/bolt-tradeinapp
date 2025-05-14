
import { generateCardNumberSearchFilter } from '../card-number/searchFilters';
import { isLikelyCardNumber } from '../card-number/variants';
import { SearchParams } from './types';
import { debugLogQuery } from './debugLogger';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { formatResultsToCardDetails } from './resultFormatter';
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
    page
  };

  // Build filter string using queryBuilder's implementation
  const filterString = buildSearchQueryFilter(searchParams);
  
  // Get sort options using queryBuilder's implementation
  const sortOptions = buildSearchSortOptions(searchParams);

  // Mock query - in a real application, this would be a database query
  const query = {
    data: [],
    error: null,
    count: 0
  };

  // Set of found set IDs (for filtering)
  const foundSetIds = new Set<number>();

  return { query, foundSetIds };
};
