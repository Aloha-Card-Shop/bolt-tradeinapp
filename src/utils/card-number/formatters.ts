
import { CardNumberObject } from '../../types/card';

/**
 * Safely get string value from a card number that might be an object
 * @param cardNumber The card number which might be string or object
 * @returns String representation of the card number
 */
export const getCardNumberString = (cardNumber: string | CardNumberObject | undefined): string => {
  if (!cardNumber) return '';
  
  if (typeof cardNumber === 'object') {
    return cardNumber.displayName || cardNumber.value || '';
  }
  
  return cardNumber;
};

/**
 * Format card number for search matching
 * @param cardNumber The card number to format
 * @returns Formatted card number
 */
export const formatCardNumberForSearch = (cardNumber: string | CardNumberObject | any): string => {
  // Get string representation first using our helper
  const cardNumberStr = getCardNumberString(cardNumber);
  
  // Clean the card number to remove spaces and convert to lowercase
  return cardNumberStr.trim().toLowerCase();
};

/**
 * Extract the number before the slash in a card number
 * @param cardNumber The card number string or object
 * @returns Just the number before the slash, or the full number if no slash is present
 */
export const extractNumberBeforeSlash = (cardNumber: string | CardNumberObject | undefined): string => {
  const numberStr = getCardNumberString(cardNumber);
  if (!numberStr) return '';
  
  // Extract the part before the slash if it exists
  const match = numberStr.match(/^(\d+)/);
  return match ? match[1] : numberStr;
};

/**
 * Normalize a card number by removing leading zeros from the numeric part before the slash
 * @param cardNumber The card number to normalize
 * @returns Normalized card number
 */
export const normalizeCardNumber = (cardNumber: string | CardNumberObject | undefined): string => {
  const numberStr = getCardNumberString(cardNumber);
  if (!numberStr) return '';
  
  // If it has a slash format like "004/102", normalize to "4/102"
  if (numberStr.includes('/')) {
    const [numPart, setPart] = numberStr.split('/', 2);
    return parseInt(numPart, 10) + '/' + setPart;
  }
  
  // If it's just a number with leading zeros like "004", normalize to "4"
  if (/^0+\d+$/.test(numberStr)) {
    return numberStr.replace(/^0+/, '');
  }
  
  return numberStr;
};
