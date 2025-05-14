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
    if (isLikelyCardNumber(name)) {
      // Pass all three args: (searchValue, jsonField, cardNumberColumn)
      const cardNumberFilter = generateCardNumberSearchFilter(
        name,
        'attributes',
        'card_number'
      );
      if (cardNumberFilter) {
        conditions.push(
          `(name ILIKE '%${name.replace(/'/g, "''")}%' OR ` +
          `${cardNumberFilter} OR ` +
          `card_number ILIKE '%${name.replace(/'/g, "''")}%' )`
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

  // Handle explicit card-number search
  if (cardNumber !== undefined && `${cardNumber}`.trim()) {
    const cnFilter = generateCardNumberSearchFilter(
      cardNumber,
      'attributes',
      'card_number'
    );
    if (cnFilter) {
      conditions.push(
        `(${cnFilter} OR ` +
        `card_number ILIKE '%${`${cardNumber}`.replace(/'/g, "''")}%' )`
      );
    }
  }

  // Combine conditions
  const filterString = conditions.length
    ? conditions.join(' AND ')
    : '';

  // Debug log
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
  const defaultSort = { column: 'name', ascending: true };

  if (sortBy) {
    return {
      column: sortBy,
      ascending: sortDirection !== 'desc',
    };
  }
  return defaultSort;
};
