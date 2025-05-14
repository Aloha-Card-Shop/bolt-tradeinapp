
import { isLikelyCardNumber } from '../card-number/variants';
import { SearchParams } from './types';
import { debugLogQuery } from './debugLogger';

/**
 * Build a Supabase query filter for unified_products table searches
 * @param params Search parameters 
 * @returns SQL filter string for use in Supabase query
 */
export const buildSearchQueryFilter = (params: SearchParams): string => {
  const { name, set, cardNumber, game } = params;
  const conditions: string[] = [];

  // Always filter by game type if provided
  // Map game to category_id for unified_products table
  if (game) {
    if (game === 'pokemon') {
      conditions.push('category_id = 3');
    } else if (game === 'japanese-pokemon') {
      conditions.push('category_id = 85');
    } else if (game === 'magic') {
      conditions.push('category_id = 1');
    }
  }

  // Handle card name search
  if (name && name.trim()) {
    // If the name looks like a card number, we also check the card_number column
    if (isLikelyCardNumber(name)) {
      conditions.push(
        `(name ILIKE '%${name.replace(/'/g, "''")}%' OR card_number ILIKE '%${name.replace(/'/g, "''")}%')`
      );
    } else {
      // Standard name search
      conditions.push(`name ILIKE '%${name.replace(/'/g, "''")}%'`);
    }
  }

  // Handle set name filter by mapping to group_id
  if (set && set.trim()) {
    // In unified_products we need to join with groups or use a subquery
    // For now, we'll use a simplified approach that works with our existing data model
    conditions.push(`group_id IN (SELECT groupid FROM public.groups WHERE name = '${set.replace(/'/g, "''")}')`);
  }

  // Handle specific card number search - simpler with unified_products as it has a dedicated card_number column
  if (cardNumber && cardNumber.toString().trim()) {
    const cardNumberStr = typeof cardNumber === 'object' ? 
      (cardNumber.displayName || cardNumber.value || '') : 
      cardNumber.toString();
      
    conditions.push(`card_number ILIKE '%${cardNumberStr.replace(/'/g, "''")}%'`);
  }

  // Combine all conditions with AND
  const filterString = conditions.length > 0
    ? conditions.join(' AND ')
    : '';

  // Log the generated query for debugging
  debugLogQuery(filterString, params);

  return filterString;
};

/**
 * Builds sort options for card searches
 * @param params Search parameters
 * @returns Sort configuration for Supabase query
 */
export const buildSearchSortOptions = (
  params: SearchParams
): { column: string; ascending: boolean } => {
  const { sortBy, sortDirection } = params;

  // Default sort
  const defaultSort = { column: 'name', ascending: true };

  // Map fields to unified_products table columns
  let column = sortBy;
  if (sortBy === 'set') {
    column = 'group_id'; // Set corresponds to group_id in unified_products
  } else if (sortBy === 'number') {
    column = 'card_number';
  }

  // Return sort configuration
  if (column) {
    return {
      column,
      ascending: sortDirection !== 'desc',
    };
  }

  return defaultSort;
};
