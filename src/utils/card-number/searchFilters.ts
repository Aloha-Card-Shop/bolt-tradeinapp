
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
    
    // Search for both capitalization variants (Number and number)
    // Also search in the nested structure for both displayName and value
    let conditions = [];
    
    // Search for uppercase "Number" (most common in the database)
    conditions.push(`attributes->>'Number' ILIKE '%${safeNumber}%'`);
    
    // Search for lowercase "number" as a fallback
    conditions.push(`attributes->>'number' ILIKE '%${safeNumber}%'`);
    
    // Search in nested Number object structure
    conditions.push(`(attributes->'Number'->>'displayName') ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'Number'->>'value') ILIKE '%${safeNumber}%'`);
    
    // Search in nested number object structure
    conditions.push(`(attributes->'number'->>'displayName') ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'number'->>'value') ILIKE '%${safeNumber}%'`);
    
    // Combine all conditions with OR
    return '(' + conditions.join(' OR ') + ')';
  } catch (error) {
    console.error("Error generating card number filter:", error);
    return null;
  }
};
