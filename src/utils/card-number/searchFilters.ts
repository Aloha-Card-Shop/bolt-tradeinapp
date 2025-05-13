
import { getCardNumberString, extractNumberBeforeSlash, normalizeCardNumber } from './formatters';

/**
 * Builds a card number search query with proper JSONB extraction
 * @param query The Supabase query to add filters to
 * @param cardNumber The card number to search for
 * @returns The modified query with card number filters
 */
export const buildCardNumberSearchQuery = (query: any, cardNumber: string): any => {
  if (!cardNumber) return query;
  
  console.log(`Building card number search for: "${cardNumber}"`);
  
  // Generate all possible variants for this card number
  const variants = generateCardNumberVariants(cardNumber);
  console.log(`Generated ${variants.length} search variants:`, variants);
  
  // Create filter conditions using the correct JSONB path syntax
  const filterConditions: string[] = [];
  
  variants.forEach(variant => {
    // Correct JSONB path syntax with text extraction operator ->>
    filterConditions.push(`attributes->'Number'->>'value'.ilike.%${variant}%`);
    filterConditions.push(`attributes->'number'->>'value'.ilike.%${variant}%`);
    filterConditions.push(`attributes->>'Number'.ilike.%${variant}%`);
    filterConditions.push(`attributes->>'number'.ilike.%${variant}%`);
    filterConditions.push(`attributes->>'card_number'.ilike.%${variant}%`);
  });
  
  // Join filter conditions with commas for Supabase OR syntax
  const orConditionString = filterConditions.join(',');
  console.log(`Final OR condition string: ${orConditionString}`);
  
  // Apply the OR condition to the query
  return query.or(orConditionString);
};

/**
 * Generate all possible variations of a card number for comprehensive searching
 * @param cardNumber The original card number
 * @returns Array of card number variants to search for
 */
export const generateCardNumberVariants = (cardNumber: string | any): string[] => {
  if (!cardNumber) return [];
  
  const originalStr = typeof cardNumber === 'string' ? cardNumber : String(cardNumber);
  const variants = new Set<string>();
  
  // Add the original string
  variants.add(originalStr);
  
  // If it contains a slash, add variants with and without leading zeros
  if (originalStr.includes('/')) {
    const [numPart, setPart] = originalStr.split('/', 2);
    
    // Add variant with leading zeros removed
    variants.add(parseInt(numPart, 10) + '/' + setPart);
    
    // Add versions with leading zeros
    variants.add(numPart.padStart(3, '0') + '/' + setPart);
    variants.add(numPart.padStart(2, '0') + '/' + setPart);
  } else {
    // For numbers without slash, add versions with leading zeros
    if (/^\d+$/.test(originalStr)) {
      variants.add(originalStr.padStart(3, '0'));
      variants.add(originalStr.padStart(2, '0'));
      variants.add(originalStr.replace(/^0+/, ''));
    }
  }
  
  return [...variants];
};

/**
 * Creates card number filters for both exact and partial matches with improved handling
 * @param cardNumber The card number to search for
 * @returns Array of filter strings specifically for card number search
 */
export const createCardNumberFilters = (cardNumber: string): string[] => {
  if (!cardNumber) return [];
  
  const filters = [];
  const numberBeforeSlash = extractNumberBeforeSlash(cardNumber);
  const normalizedNumber = normalizeCardNumber(cardNumber);
  const isNumericOnly = /^\d+$/.test(cardNumber);
  
  // Priority 1: Exact matches (highest priority)
  filters.push(`attributes->>'card_number'.eq.${cardNumber}`);
  filters.push(`attributes->>'Number'.eq.${cardNumber}`);
  
  // Priority 1.5: Normalized matches (also high priority)
  if (normalizedNumber !== cardNumber) {
    filters.push(`attributes->>'card_number'.eq.${normalizedNumber}`);
    filters.push(`attributes->>'Number'.eq.${normalizedNumber}`);
  }
  
  // Priority 2: Prefix matches (card number starts with the search term)
  filters.push(`attributes->>'card_number'.ilike.${cardNumber}%`);
  filters.push(`attributes->>'Number'.ilike.${cardNumber}%`);
  
  // Priority 3: Handle where card number might be a prefix with slash
  filters.push(`attributes->>'card_number'.ilike.${cardNumber}/%`);
  filters.push(`attributes->>'Number'.ilike.${cardNumber}/%`);
  
  // Priority 4: If searching for just digits, look for those digits at start of number
  if (isNumericOnly) {
    // For numeric searches, add specific pattern match for numbers at the start
    // This helps when searching for "25" to find "25/123" or similar patterns
    filters.push(`attributes->>'card_number'.ilike.${cardNumber}/%`);
    filters.push(`attributes->>'Number'.ilike.${cardNumber}/%`);
    
    // Also look for the digits anywhere in the number
    filters.push(`attributes->>'card_number'.ilike.%${cardNumber}%`);
    filters.push(`attributes->>'Number'.ilike.%${cardNumber}%`);
    
    // Add padded number patterns (e.g., searching for "4" also finds "004")
    const paddedNumber = cardNumber.padStart(3, '0');
    if (paddedNumber !== cardNumber) {
      filters.push(`attributes->>'card_number'.eq.${paddedNumber}`);
      filters.push(`attributes->>'Number'.eq.${paddedNumber}`);
      filters.push(`attributes->>'card_number'.ilike.${paddedNumber}%`);
      filters.push(`attributes->>'Number'.ilike.${paddedNumber}%`);
    }
  }
  
  // Handle specific case where numberBeforeSlash is different
  if (numberBeforeSlash !== cardNumber) {
    // Add search for just the number before slash followed by slash
    filters.push(`attributes->>'card_number'.ilike.${numberBeforeSlash}/%`);
    filters.push(`attributes->>'Number'.ilike.${numberBeforeSlash}/%`);
    
    // Also try with padded number before slash
    const paddedNumberBeforeSlash = numberBeforeSlash.padStart(3, '0');
    if (paddedNumberBeforeSlash !== numberBeforeSlash) {
      filters.push(`attributes->>'card_number'.ilike.${paddedNumberBeforeSlash}/%`);
      filters.push(`attributes->>'Number'.ilike.${paddedNumberBeforeSlash}/%`);
    }
  }
  
  // Add pattern matches for common formats
  if (isNumericOnly) {
    // If we're searching for just a number like "123", also check:
    // - SW123 (number at end)
    // - S-123 (number after hyphen)
    // - 123/ABC (number before slash)
    // - 123A (number followed by letter)
    
    filters.push(`attributes->>'card_number'.ilike.%${cardNumber}`); // Ends with number
    filters.push(`attributes->>'Number'.ilike.%${cardNumber}`);
    
    filters.push(`attributes->>'card_number'.ilike.%-${cardNumber}%`); // After hyphen
    filters.push(`attributes->>'Number'.ilike.%-${cardNumber}%`);
    
    filters.push(`attributes->>'card_number'.ilike.${cardNumber}/%`); // Before slash
    filters.push(`attributes->>'Number'.ilike.${cardNumber}/%`);
  }
  
  return filters;
};
