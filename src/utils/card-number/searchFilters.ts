
import { CardNumberObject } from '../../types/card';
import { normalizeCardNumber } from './formatters';

/**
 * Handle searching when given a card number to match
 * Works with both number strings (e.g., "123") and card number objects
 * @param cardNumber Card number to search for
 * @returns SQL condition fragment for searching
 */
export const generateCardNumberSearchFilter = (cardNumber?: string | CardNumberObject): string | null => {
  if (!cardNumber) return null;

  // Convert object to string if needed
  const cardNumberStr = typeof cardNumber === 'object' 
    ? (cardNumber.displayName || cardNumber.value || '') 
    : cardNumber;
    
  if (!cardNumberStr.trim()) return null;

  // Normalize to remove leading zeros
  const normalizedNumber = normalizeCardNumber(cardNumberStr);
  
  // For card numbers with slash format (e.g., "123/456")
  if (normalizedNumber.includes('/')) {
    return `attributes->>'number' ILIKE '%${normalizedNumber.replace(/'/g, "''")}%'`;
  }
  
  // For simple number search (e.g., "123"), match either standalone or as part of "123/456"
  return `attributes->>'number' ILIKE '%${normalizedNumber.replace(/'/g, "''")}%'`;
};
