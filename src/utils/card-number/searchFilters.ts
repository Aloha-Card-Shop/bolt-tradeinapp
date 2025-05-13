
import { CardNumberObject } from '../../types/card';
import { normalizeCardNumber, getCardNumberString } from './formatters';

/**
 * Handle searching when given a card number to match
 * Works with both number strings (e.g., "123") and card number objects
 * @param cardNumber Card number to search for
 * @returns SQL condition fragment for searching
 */
export const generateCardNumberSearchFilter = (cardNumber?: string | CardNumberObject): string | null => {
  if (!cardNumber) return null;

  // First get a standardized string representation
  const cardNumberStr = getCardNumberString(cardNumber);
    
  if (!cardNumberStr || !cardNumberStr.trim()) return null;

  try {
    // Normalize to remove leading zeros
    const normalizedNumber = normalizeCardNumber(cardNumberStr);
    
    // Escape single quotes to prevent SQL injection
    const safeNumber = normalizedNumber.replace(/'/g, "''");
    
    // For card numbers with slash format (e.g., "123/456")
    if (safeNumber.includes('/')) {
      return `attributes->>'number' ILIKE '%${safeNumber}%'`;
    }
    
    // For simple number search (e.g., "123"), match either standalone or as part of "123/456"
    return `attributes->>'number' ILIKE '%${safeNumber}%'`;
  } catch (error) {
    console.error("Error generating card number filter:", error);
    return null;
  }
};
