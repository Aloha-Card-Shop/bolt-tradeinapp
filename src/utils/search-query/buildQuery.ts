
import { SearchParams } from './types';
import { buildSearchQueryFilter, buildSearchSortOptions } from './queryBuilder';
import { debugLogQuery } from './debugLogger';
import { CardDetails } from '../../types/card';
import { supabase } from '../../lib/supabase';

// Define constants for pagination
export const RESULTS_PER_PAGE = 40;

/**
 * Build a complete search query for cards using the unified_products table
 * @param cardDetails Card search parameters
 * @param page Page number for pagination
 * @returns Query and related metadata
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  page: number = 0
): Promise<{
  query: any;
  foundSetIds: Set<number>;
}> => {
  console.log('Building search query with:', { cardDetails, page });

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

  // Debug log the query parameters
  debugLogQuery(filter, searchParams);
  console.log('Search filter:', filter);
  console.log('Sort options:', sort);
  
  // Create a real Supabase query targeting the unified_products table
  let query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' });

  // Apply filter if it exists - FIXED: use proper filter method
  if (filter && filter.trim() !== '') {
    console.log('Applying filter:', filter);
    query = query.filter(filter);
  }
  
  // Apply sorting
  query = query.order(sort.column, { ascending: sort.ascending });
  
  // Apply pagination
  const start = page * RESULTS_PER_PAGE;
  const end = (page + 1) * RESULTS_PER_PAGE - 1;
  query = query.range(start, end);
  
  console.log(`Fetching results ${start} to ${end}`);
  
  // Execute the query
  const { data, error, count } = await query;
  
  console.log('Query results:', { 
    resultCount: data?.length || 0, 
    totalCount: count,
    error: error || 'none'
  });
  
  // Set of found set IDs (for filtering)
  const foundSetIds = new Set<number>();
  
  // Extract group_ids from the results
  if (data && data.length > 0) {
    data.forEach(item => {
      if (item.group_id) {
        foundSetIds.add(item.group_id);
      }
    });
    console.log(`Found ${foundSetIds.size} unique set IDs`);
  }
  
  return { 
    query: {
      data: data || [],
      error,
      count: count || 0,
      filter,
      sort
    }, 
    foundSetIds 
  };
};
