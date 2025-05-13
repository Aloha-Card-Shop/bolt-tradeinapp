
import { CardDetails } from '../../types/card';
import { SetOption } from '../../hooks/useSetOptions';

/**
 * Extract card number from attributes in various possible formats
 * @param attributes Card attributes object that might contain card number
 * @returns The card number as a string, or empty string if not found
 */
const extractCardNumber = (attributes: any): string => {
  if (!attributes) return '';

  let cardNumber = '';

  // Check various card number paths in order of likelihood
  // 1. Check for Number field (most common)
  if (attributes.Number) {
    if (typeof attributes.Number === 'object') {
      cardNumber = attributes.Number.displayName || attributes.Number.value || '';
    } else {
      cardNumber = attributes.Number;
    }
  } 
  // 2. Check for lowercase number field
  else if (attributes.number) {
    if (typeof attributes.number === 'object') {
      cardNumber = attributes.number.displayName || attributes.number.value || '';
    } else {
      cardNumber = attributes.number;
    }
  } 
  // 3. Check for card_number field
  else if (attributes.card_number) {
    if (typeof attributes.card_number === 'object') {
      cardNumber = attributes.card_number.displayName || attributes.card_number.value || '';
    } else {
      cardNumber = attributes.card_number;
    }
  }
  // 4. Check for properties.number field
  else if (attributes.properties && attributes.properties.number) {
    if (typeof attributes.properties.number === 'object') {
      cardNumber = attributes.properties.number.displayName || attributes.properties.number.value || '';
    } else {
      cardNumber = attributes.properties.number;
    }
  }

  return cardNumber ? String(cardNumber).trim() : '';
};

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
    
    // Extract card number with enhanced function
    const cardNumber = extractCardNumber(item.attributes);
    
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
