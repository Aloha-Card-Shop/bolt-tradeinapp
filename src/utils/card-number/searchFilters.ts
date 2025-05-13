
import { CardNumberObject } from '../../types/card';
import { normalizeCardNumber, getCardNumberString } from './formatters';
import { generateCardNumberVariants } from './variants';

/**
 * Handle searching when given a card number to match
 * Works with both number strings (e.g., "123") and card number objects
 * @param cardNumber Card number to search for
 * @returns SQL condition fragment for searching
 */
export const generateCardNumberSearchFilter = (cardNumber?: string | CardNumberObject | number): string | null => {
  if (!cardNumber) return null;

  // First get a standardized string representation
  const cardNumberStr = getCardNumberString(cardNumber);
    
  if (!cardNumberStr || !cardNumberStr.trim()) return null;

  try {
    // Normalize to remove leading zeros
    const normalizedNumber = normalizeCardNumber(cardNumberStr);
    
    // Escape single quotes to prevent SQL injection
    const safeNumber = normalizedNumber.replace(/'/g, "''");
    
    // Generate all possible variants for card number
    const variants = generateCardNumberVariants(cardNumberStr);
    const variantConditions = variants.map(variant => {
      const safeVariant = variant.replace(/'/g, "''");
      return `card_number ILIKE '%${safeVariant}%'`;
    });
    
    // Search for both capitalization variants (Number and number)
    // Also search in the nested structure for both displayName and value
    let conditions = [];
    
    // First prioritize the new dedicated card_number column
    if (variantConditions.length > 0) {
      conditions.push('(' + variantConditions.join(' OR ') + ')');
    }
    
    // Fallback to searching in JSON for backwards compatibility
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
    
    // Search in card_number field as well
    conditions.push(`attributes->>'card_number' ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'card_number'->>'displayName') ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'card_number'->>'value') ILIKE '%${safeNumber}%'`);
    
    // Search in properties.number field
    conditions.push(`(attributes->'properties'->>'number') ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'properties'->'number'->>'displayName') ILIKE '%${safeNumber}%'`);
    conditions.push(`(attributes->'properties'->'number'->>'value') ILIKE '%${safeNumber}%'`);
    
    // Combine all conditions with OR
    return '(' + conditions.join(' OR ') + ')';
  } catch (error) {
    console.error("Error generating card number filter:", error);
    return null;
  }
};
