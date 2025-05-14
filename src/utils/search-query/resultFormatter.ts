
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';

/**
 * Format raw database results from unified_products table into CardDetails objects
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
    
    // Card number is directly available in unified_products
    const cardNumber = item.card_number || '';
    
    // Log for debugging
    if (!cardNumber) {
      console.log('No card number found for:', item.name);
    }
    
    // Create the card details object
    return {
      name: item.name || '',
      set: setName,
      number: cardNumber,
      productId: item.tcgplayer_product_id || item.product_id || null,
      imageUrl: item.image_url || '',
      game: originalCardDetails.game,
      categoryId: item.category_id || originalCardDetails.categoryId,
      attributes: item.attributes || {}
    };
  });
};
