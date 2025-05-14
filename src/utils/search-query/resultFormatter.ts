
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
  if (!data || data.length === 0) {
    console.log('No data to format into CardDetails');
    return [];
  }
  
  console.log(`Formatting ${data.length} results to CardDetails`);
  console.log('Sample data item:', data[0]);
  
  return data.map(item => {
    // Get set name from setOptions using group_id
    const setOption = setOptions.find(s => s.id === item.group_id);
    const setName = setOption?.name || '';
    
    if (!setName && item.group_id) {
      console.log(`Could not find set name for group_id: ${item.group_id}`);
    }
    
    // Card number is directly available in unified_products
    const cardNumber = item.card_number || '';
    
    // Log for debugging
    if (!cardNumber) {
      console.log('No card number found for:', item.name);
    }
    
    // Product ID can come from tcgplayer_product_id or product_id
    const productId = item.tcgplayer_product_id || item.product_id || null;
    
    // Create the card details object
    return {
      name: item.name || '',
      set: setName,
      number: cardNumber,
      productId: productId,
      imageUrl: item.image_url || '',
      game: originalCardDetails.game,
      categoryId: item.category_id || originalCardDetails.categoryId,
      attributes: item.attributes || {}
    };
  });
};
