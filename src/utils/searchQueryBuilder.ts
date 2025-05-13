import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { getCardNumberString } from './cardSearchUtils';

const DEBUG_MODE = true;
export const RESULTS_PER_PAGE = 48;

export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number = 0
): Promise<{ query: any; foundSetIds: Set<number> }> => {
  const { name, set, number, categoryId } = cardDetails;
  const foundSetIds: Set<number> = new Set();
  const from = page * RESULTS_PER_PAGE;
  const to = (page + 1) * RESULTS_PER_PAGE - 1;

  let query = supabase
    .from('unified_products')
    .select('id, name, group_id, image_url, attributes, product_id, tcgplayer_product_id', { count: 'exact' })
    .order('name')
    .range(from, to);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
    if (DEBUG_MODE) console.log(`Added category filter: ${categoryId}`);
  }

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

  if (number) {
    const cardNumberStr = getCardNumberString(number).trim();
    const padded = cardNumberStr.padStart(3, '0');
    const variants = Array.from(
      new Set([
        cardNumberStr,
        padded,
        `${cardNumberStr}/102`,
        `${padded}/102`
      ])
    );

    const filters = variants.map(
      v => `attributes->'Number'->>'value'.ilike.%${v.replace(/'/g, "'')}%`
    );

    const orString = filters.join(',');
    if (DEBUG_MODE) {
      console.log('Card number filter variants:', variants);
      console.log('Card number filter OR string:', orString);
    }

    query = query.or(orString);
  }

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
