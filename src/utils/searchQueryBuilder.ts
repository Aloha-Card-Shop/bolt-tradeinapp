
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { createSearchFilters, formatCardNumberForSearch, extractNumberBeforeSlash, isLikelyCardNumber } from './cardSearchUtils';

// Number of results to fetch per page
export const RESULTS_PER_PAGE = 15;

/**
 * Builds a Supabase search query based on the provided criteria
 * @param cardDetails Details of the card to search for
 * @param setOptions Available set options
 * @param page Page number for pagination
 * @returns The built query and collection of found set IDs
 */
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number
) => {
  let query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' })
    .eq('category_id', cardDetails.categoryId as number);

  // Add set filter if specified
  if (cardDetails.set) {
    const setOption = setOptions.find(s => s.name === cardDetails.set);
    if (setOption) {
      query = query.eq('group_id', setOption.id);
    }
  }

  // Split search terms and create individual filters
  const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
  
  const foundSetIds = new Set<number>();
  
  // Prepare search filters for name and/or card number
  if (searchTerms.length > 0 || cardDetails.number) {
    // Format card number for search if provided
    const formattedNumber = cardDetails.number ? 
      formatCardNumberForSearch(cardDetails.number) : undefined;
    
    // Check if any search term is a number (potential card number)
    const potentialCardNumbers = searchTerms
      .filter(isLikelyCardNumber)
      .map(term => term.trim());
    
    // Create filters for the query
    let filters = createSearchFilters(searchTerms, formattedNumber);
    
    // If user entered just a number in name field, also search as a card number
    if (potentialCardNumbers.length > 0) {
      potentialCardNumbers.forEach(numTerm => {
        const nameAsNumberFilters = [
          `attributes->>'card_number'.ilike.${numTerm}/%`,
          `attributes->>'Number'.ilike.${numTerm}/%`,
          `attributes->>'card_number'.ilike.${numTerm}%`,
          `attributes->>'Number'.ilike.${numTerm}%`
        ];
        filters.push(`or(${nameAsNumberFilters.join(',')})`);
        
        // Log this special search case
        console.log(`Also searching for card number using name field: ${numTerm}`);
      });
    }
    
    // Combine all filters
    const finalFilter = filters.length > 1 ? `and(${filters.join(',')})` : filters[0];
    
    if (finalFilter) {
      query = query.or(finalFilter);
    }
  }

  // Add pagination
  query = query
    .order('name')
    .range(page * RESULTS_PER_PAGE, (page + 1) * RESULTS_PER_PAGE - 1);

  return { query, foundSetIds };
};

/**
 * Format API results to CardDetails objects
 * @param results Raw search results
 * @param setOptions Available set options
 * @param searchCriteria Original search criteria
 * @returns Formatted card results
 */
export const formatResultsToCardDetails = (
  results: any[], 
  setOptions: SetOption[],
  searchCriteria: CardDetails
): CardDetails[] => {
  const formatted = results.map(product => {
    // Extract card number carefully to avoid returning objects
    let cardNumber = '';
    if (product.attributes) {
      const rawCardNumber = product.attributes.card_number || product.attributes.Number || '';
      
      // Handle case when card number is an object with displayName or value
      if (typeof rawCardNumber === 'object' && rawCardNumber !== null) {
        cardNumber = rawCardNumber.displayName || rawCardNumber.value || '';
      } else {
        cardNumber = String(rawCardNumber);
      }
    }
    
    // Add logging for better debugging
    if (searchCriteria.number) {
      const formattedSearchNumber = formatCardNumberForSearch(searchCriteria.number);
      const formattedResultNumber = formatCardNumberForSearch(cardNumber);
      const resultNumberBeforeSlash = extractNumberBeforeSlash(cardNumber);
      
      // Log matches to help debug the search logic
      if (
        formattedResultNumber.includes(formattedSearchNumber) ||
        resultNumberBeforeSlash === formattedSearchNumber
      ) {
        console.log(`Found card with number match: ${product.name} (#${cardNumber}) - searched for: ${searchCriteria.number}`);
      }
    }
    
    return {
      name: product.name,
      set: product.group_id ? setOptions.find(s => s.id === product.group_id)?.name || '' : '',
      number: cardNumber,
      game: searchCriteria.game,
      categoryId: searchCriteria.categoryId,
      imageUrl: product.image_url || null,
      productId: product.attributes?.tcgplayer_product_id || product.attributes?.product_id?.toString() || null
    };
  });
  
  // Log the total results found
  console.log(`Formatted ${formatted.length} results for search query`, {
    name: searchCriteria.name,
    number: searchCriteria.number,
    set: searchCriteria.set
  });
  
  return formatted;
};
