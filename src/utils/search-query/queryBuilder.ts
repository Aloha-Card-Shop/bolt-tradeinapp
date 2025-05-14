
import { SearchParams } from './types';
import { isLikelyCardNumber } from '../card-number/variants';
import { debugLogQuery } from './debugLogger';
import { getCardNumberString } from '../card-number/formatters';

/**
 * Build a Supabase query filter for unified_products table searches
 * @param params Search parameters 
 * @returns SQL filter string for use in Supabase query
 */
export const buildSearchQueryFilter = (params: SearchParams): string => {
  const { name, set, cardNumber, game, categoryId } = params;
  const conditions: string[] = [];

  // Add category filter (from game type)
  if (categoryId) {
    conditions.push(`category_id = ${categoryId}`);
  }
  // Or add game type filter if no categoryId but game is provided
  else if (game) {
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
    // If the name looks like a card number, check both name and card_number
    if (isLikelyCardNumber(name)) {
      conditions.push(
        `(name ILIKE '%${name.replace(/'/g, "''")}%' OR card_number ILIKE '%${name.replace(/'/g, "''")}%')`
      );
    } else {
      // Standard name search with improved ILIKE pattern
      conditions.push(`name ILIKE '%${name.replace(/'/g, "''")}%'`);
    }
  }

  // Handle set name filter using group_id
  if (set && set.trim()) {
    conditions.push(`group_id IN (SELECT groupid FROM public.groups WHERE name = '${set.replace(/'/g, "''")}')`);
  }

  // Handle card number search - use direct column in unified_products
  if (cardNumber) {
    // Get the card number as a string
    const cardNumberStr = getCardNumberString(cardNumber);
    
    if (cardNumberStr && cardNumberStr.trim()) {
      // Build a simple ILIKE query for the card_number column - avoid complex function
      conditions.push(`card_number ILIKE '%${cardNumberStr.replace(/'/g, "''")}%'`);
      
      // Also search in JSON attributes as fallback
      conditions.push(`attributes->>'Number' ILIKE '%${cardNumberStr.replace(/'/g, "''")}%'`);
      conditions.push(`attributes->>'number' ILIKE '%${cardNumberStr.replace(/'/g, "''")}%'`);
    }
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
