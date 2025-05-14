
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';
import { getCardNumberString } from '../card-number/formatters';

/**
 * Format search results from the unified_products table into CardDetails objects
 * @param results Raw search results from the unified_products table
 * @param setOptions Available set options for mapping group_id to set names
 * @param searchCriteria Original search criteria for preserving search terms
 * @returns Formatted card details array
 */
export const formatResultsToCardDetails = (
  results: any[],
  setOptions: SetOption[],
  searchCriteria?: CardDetails
): CardDetails[] => {
  if (!results || results.length === 0) {
    return [];
  }

  const setMap = new Map<number, string>();
  if (setOptions?.length > 0) {
    setOptions.forEach(set => {
      if (set.id) {
        setMap.set(set.id, set.name);
      }
    });
  }

  return results.map(product => {
    // Extract set name from map or group_id directly
    const setName = setMap.get(product.group_id) || 
      (product.group_id ? `Set ID: ${product.group_id}` : '');
    
    // Extract card number from unified_products
    const cardNumber = product.card_number || 
      (product.attributes && product.attributes.card_number) || 
      '';
      
    // Preserve original card number from search if we're looking at a specific result
    const finalCardNumber = searchCriteria?.number && 
      getCardNumberString(product.card_number) === getCardNumberString(searchCriteria.number) 
      ? searchCriteria.number 
      : cardNumber;

    // Construct clean card details object
    return {
      name: product.name,
      set: setName,
      number: finalCardNumber,
      productId: product.product_id?.toString() || product.tcgplayer_product_id,
      imageUrl: product.image_url,
      game: searchCriteria?.game || 'pokemon',
      categoryId: product.category_id,
      clean_name: product.clean_name
    };
  });
};
