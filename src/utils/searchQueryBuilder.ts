
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { getCardNumberString, generateCardNumberVariants } from './cardSearchUtils';

const DEBUG_MODE = true;
export const RESULTS_PER_PAGE = 48;

/**
 * Format the search results into CardDetails objects
 * @param results Raw search results from Supabase
 * @param setOptions Available set options for mapping group IDs to set names
 * @param searchCriteria Original search criteria for fallback values
 * @returns Array of formatted CardDetails objects
 */
export const formatResultsToCardDetails = (
  results: any[],
  setOptions: SetOption[],
  searchCriteria: CardDetails
): CardDetails[] => {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return [];
  }

  if (DEBUG_MODE) {
    console.log(`Formatting ${results.length} search results`);
  }

  return results.map(item => {
    // Get set name from setOptions using the group_id
    const setName = item.group_id 
      ? setOptions.find(s => s.id === item.group_id)?.name || undefined
      : searchCriteria.set || undefined;
    
    // Extract card number from attributes if available
    let cardNumber: string | undefined = undefined;
    if (item.attributes) {
      cardNumber = 
        (item.attributes.Number && item.attributes.Number.value) ||
        (item.attributes.number && item.attributes.number.value) ||
        item.attributes.card_number || 
        searchCriteria.number || 
        undefined;
    }
    
    // Build the card details
    const card: CardDetails = {
      name: item.name || searchCriteria.name || '',
      set: setName,
      number: cardNumber,
      game: searchCriteria.game,
      categoryId: item.category_id || searchCriteria.categoryId,
      imageUrl: item.image_url || undefined,
      productId: item.tcgplayer_product_id || item.product_id?.toString() || undefined,
      id: item.id?.toString() || undefined,
    };

    return card;
  });
};

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
    
    // Generate normalized variants for robust searching
    const variants = generateCardNumberVariants(cardNumberStr);
    
    // Create filter conditions using the correct JSONB path syntax
    const filterConditions: string[] = [];
    
    variants.forEach(variant => {
      // Use the correct JSONB path syntax for Supabase
      filterConditions.push(`attributes->'Number'->>'value'.ilike.%${variant}%`);
      
      // Add fallback paths for different attribute structures
      filterConditions.push(`attributes->'number'->>'value'.ilike.%${variant}%`);
      filterConditions.push(`attributes->>'card_number'.ilike.%${variant}%`);
    });
    
    // Join filter conditions with commas for OR syntax
    const orString = filterConditions.join(',');
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

  // Log the final query for debugging
  if (DEBUG_MODE) {
    console.log('Final search query:', JSON.stringify(query));
  }

  return { query, foundSetIds };
};
