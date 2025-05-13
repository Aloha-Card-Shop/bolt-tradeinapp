
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';

/**
 * Format raw database results into CardDetails objects
 * @param data Raw data from the database query
 * @param setOptions Available set options to map IDs to names
 * @param originalCardDetails Original card details from search
 * @returns Array of CardDetails objects
 */
export const formatResultsToCardDetails = (
  data: any[], 
  setOptions: SetOption[],
  originalCardDetails: CardDetails
): CardDetails[] => {
  if (!data || data.length === 0) return [];
  
  return data.map(item => {
    // Get set name from setOptions using group_id
    const setName = setOptions.find(s => s.id === item.group_id)?.name || '';
    
    // Extract card number from attributes if available
    let cardNumber = '';
    if (item.attributes && item.attributes.Number) {
      cardNumber = typeof item.attributes.Number === 'object'
        ? item.attributes.Number.displayName || item.attributes.Number.value || ''
        : item.attributes.Number;
    }
    
    // Create the card details object
    return {
      name: item.name || '',
      set: setName,
      number: cardNumber || '',
      productId: item.product_id || item.tcgplayer_product_id || null,
      imageUrl: item.image_url || '',
      game: originalCardDetails.game,
      categoryId: originalCardDetails.categoryId,
      attributes: item.attributes || {}
    };
  });
};
