
import { generateCardNumberSearchFilter } from '../card-number/searchFilters';
import { isLikelyCardNumber } from '../card-number/variants';
import { SearchParams } from './types';
import { debugLogQuery } from './debugLogger';

/**
 * Build a Supabase query filter for card searches
 * @param params Search parameters 
 * @returns SQL filter string for use in Supabase query
 */
export const buildSearchQueryFilter = (params: SearchParams): string => {
  const { name, set, cardNumber, game } = params;
  const conditions: string[] = [];

  // Always filter by game type
  if (game) {
    conditions.push(`game = '${game}'`);
  }

  // Handle card name search
  if (name && name.trim()) {
    // If the name looks like a card number, we also check the card_number column
    if (isLikelyCardNumber(name)) {
      // Add card number search to conditions (this will be ORed with name search)
      const cardNumberFilter = generateCardNumberSearchFilter(
        name,
        'attributes',
        'card_number'
      );
      if (cardNumberFilter) {
        conditions.push(
          `(name ILIKE '%${name.replace(/'/g, "''")}%' OR ${cardNumberFilter} OR card_number ILIKE '%${name.replace(/'/g, "''")}%')`
        );
      } else {
        conditions.push(`name ILIKE '%${name.replace(/'/g, "''")}%'`);
      }
    } else {
      // Standard name search
      conditions.push(`name ILIKE '%${name.replace(/'/g, "''")}%'`);
    }
  }

  // Handle set name filter
  if (set && set.trim()) {
    conditions.push(`set_name = '${set.replace(/'/g, "''")}'`);
  }

  // Handle specific card number search — now using both JSON attributes and the dedicated column
  if (cardNumber && cardNumber.toString().trim()) {
    const cardNumberFilter = generateCardNumberSearchFilter(
      cardNumber,
      'attributes',
      'card_number'
    );
    if (cardNumberFilter) {
      conditions.push(
        `(${cardNumberFilter} OR card_number ILIKE '%${cardNumber
          .toString()
          .replace(/'/g, "''")}%')`
      );
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

  // Return sort configuration
  if (sortBy) {
    return {
      column: sortBy,
      ascending: sortDirection !== 'desc',
    };
  }

  return defaultSort;
};
