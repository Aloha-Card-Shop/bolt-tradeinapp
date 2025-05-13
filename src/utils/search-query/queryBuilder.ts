
import { supabase } from '../../lib/supabase';
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';
import { generateCardNumberSearchFilter } from '../card-number/searchFilters';
import { QueryResult, RESULTS_PER_PAGE } from './types';
import { getCardNumberString } from '../card-number/formatters';

const DEBUG_MODE = true;

/**
 * Build a search query for the Supabase database
 * @param cardDetails Card details to search for
 * @param setOptions Available set options to map IDs to names
 * @param page Page number for pagination (0-based)
 * @returns Query object and found set IDs
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number = 0
): Promise<QueryResult> => {
  const { name, set, number, categoryId } = cardDetails;
  const foundSetIds: Set<number> = new Set();
  const from = page * RESULTS_PER_PAGE;
  const to = (page + 1) * RESULTS_PER_PAGE - 1;

  let query = supabase
    .from('unified_products')
    .select('id, name, group_id, image_url, attributes, product_id, tcgplayer_product_id', { count: 'exact' })
    .order('name')
    .range(from, to);

  // Apply category filter if provided
  if (categoryId) {
    query = query.eq('category_id', categoryId);
    if (DEBUG_MODE) console.log(`Added category filter: ${categoryId}`);
  }

  // Apply set filter if provided
  if (set) {
    const setId = setOptions.find(s => s.name === set)?.id;
    if (setId) {
      query = query.eq('group_id', setId);
      foundSetIds.add(setId);
      if (DEBUG_MODE) console.log(`Added set filter, mapped "${set}" to ID: ${setId}`);
    } else if (DEBUG_MODE) {
      console.warn(`Set "${set}" not found in setOptions`);
    }
  }

  // Apply card number filter if provided
  if (number) {
    try {
      const cardNumberFilter = generateCardNumberSearchFilter(number);
      if (cardNumberFilter) {
        // Correctly apply the raw SQL filter to narrow results using .filter() with an empty params object
        query = query.filter(cardNumberFilter, {});
        
        if (DEBUG_MODE) {
          console.log(`Added card number filter using .filter(): ${cardNumberFilter}`);
          console.log(`Searching for card number: ${getCardNumberString(number)}`);
        }
      } else if (DEBUG_MODE) {
        console.warn(`Could not generate filter for card number: ${getCardNumberString(number)}`);
      }
    } catch (error) {
      console.error("Error processing card number search:", error);
      // Continue with other filters if card number filter fails
    }
  }

  // Apply name filter if provided
  if (name) {
    const pattern = name.length <= 2 ? `${name}%` : `%${name}%`;
    query = query.ilike('name', pattern);
    if (DEBUG_MODE) console.log(`Added name filter: ${pattern}`);
  }

  if (DEBUG_MODE) {
    console.log('Final search query object:', query);
  }

  return { query, foundSetIds };
};
