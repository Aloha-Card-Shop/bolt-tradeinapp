import { CardNumberObject } from '../types/card';

/**
 * Format card number for search matching
 * @param cardNumber The card number to format
 * @returns Formatted card number
 */
export const formatCardNumberForSearch = (cardNumber: string | CardNumberObject | any): string => {
  // Check if cardNumber is an object and extract the value safely
  if (typeof cardNumber === 'object' && cardNumber !== null) {
    // Type assertion to tell TypeScript that cardNumber is a CardNumberObject
    const numberObj = cardNumber as CardNumberObject;
    cardNumber = numberObj.displayName || numberObj.value || '';
  }

  // Clean the card number to remove spaces and convert to lowercase
  const cleanNumber = String(cardNumber).trim().toLowerCase();
  
  return cleanNumber;
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

/**
 * Creates card number filters for both exact and partial matches with improved handling
 * @param cardNumber The card number to search for
 * @returns Array of filter strings specifically for card number search
 */
export const createCardNumberFilters = (cardNumber: string): string[] => {
  if (!cardNumber) return [];
  
  // Ensure cardNumber is a string
  const cardNumberStr = String(cardNumber).trim();
  if (!cardNumberStr) return [];
  
  const filters = [];
  const numberBeforeSlash = extractNumberBeforeSlash(cardNumberStr);
  const normalizedNumber = normalizeCardNumber(cardNumberStr);
  const isNumericOnly = /^\d+$/.test(cardNumberStr);
  
  // Priority 1: Exact matches (highest priority)
  filters.push(`attributes->>'card_number'.eq.${cardNumberStr}`);
  filters.push(`attributes->>'Number'.eq.${cardNumberStr}`);
  
  // Priority 1.5: Normalized matches (also high priority)
  if (normalizedNumber !== cardNumberStr) {
    filters.push(`attributes->>'card_number'.eq.${normalizedNumber}`);
    filters.push(`attributes->>'Number'.eq.${normalizedNumber}`);
  }
  
  // Priority 2: Prefix matches (card number starts with the search term)
  filters.push(`attributes->>'card_number'.ilike.${cardNumberStr}%`);
  filters.push(`attributes->>'Number'.ilike.${cardNumberStr}%`);
  
  // Priority 3: Handle where card number might be a prefix with slash
  filters.push(`attributes->>'card_number'.ilike.${cardNumberStr}/%`);
  filters.push(`attributes->>'Number'.ilike.${cardNumberStr}/%`);
  
  // Priority 4: If searching for just digits, look for those digits at start of number
  if (isNumericOnly) {
    // For numeric searches, add specific pattern match for numbers at the start
    // This helps when searching for "25" to find "25/123" or similar patterns
    filters.push(`attributes->>'card_number'.ilike.${cardNumberStr}/%`);
    filters.push(`attributes->>'Number'.ilike.${cardNumberStr}/%`);
    
    // Also look for the digits anywhere in the number
    filters.push(`attributes->>'card_number'.ilike.%${cardNumberStr}%`);
    filters.push(`attributes->>'Number'.ilike.%${cardNumberStr}%`);
    
    // Add padded number patterns (e.g., searching for "4" also finds "004")
    const paddedNumber = cardNumberStr.padStart(3, '0');
    if (paddedNumber !== cardNumberStr) {
      filters.push(`attributes->>'card_number'.eq.${paddedNumber}`);
      filters.push(`attributes->>'Number'.eq.${paddedNumber}`);
      filters.push(`attributes->>'card_number'.ilike.${paddedNumber}%`);
      filters.push(`attributes->>'Number'.ilike.${paddedNumber}%`);
    }
  }
  
  // Handle specific case where numberBeforeSlash is different
  if (numberBeforeSlash !== cardNumberStr) {
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
    
    filters.push(`attributes->>'card_number'.ilike.%${cardNumberStr}`); // Ends with number
    filters.push(`attributes->>'Number'.ilike.%${cardNumberStr}`);
    
    filters.push(`attributes->>'card_number'.ilike.%-${cardNumberStr}%`); // After hyphen
    filters.push(`attributes->>'Number'.ilike.%-${cardNumberStr}%`);
    
    filters.push(`attributes->>'card_number'.ilike.${cardNumberStr}/%`); // Before slash
    filters.push(`attributes->>'Number'.ilike.${cardNumberStr}/%`);
  }
  
  return filters;
};

/**
 * Check if a search term is likely to be a card number
 * @param searchTerm The search term to check
 * @returns True if the term appears to be a card number
 */
export const isLikelyCardNumber = (searchTerm: string): boolean => {
  if (!searchTerm) return false;
  
  // Basic check: Contains only digits
  const isJustNumber = /^\d+$/.test(searchTerm.trim());
  
  // Check if it looks like a card number with a slash pattern (e.g., "123/456")
  const isSlashPattern = /^\d+\/\w+$/.test(searchTerm.trim());
  
  // Check if it's a letter followed by numbers (e.g., "SW123")
  const isLetterNumber = /^[A-Za-z]+[-]?\d+$/.test(searchTerm.trim());
  
  return (isJustNumber && searchTerm.trim().length > 0) || isSlashPattern || isLetterNumber;
};

/**
 * Safely get string value from a card number that might be an object
 * @param cardNumber The card number which might be string or object
 * @returns String representation of the card number
 */
export const getCardNumberString = (cardNumber: string | CardNumberObject | undefined): string => {
  if (!cardNumber) return '';
  
  if (typeof cardNumber === 'object') {
    if (cardNumber.displayName) return cardNumber.displayName;
    if (cardNumber.value) return cardNumber.value;
    if (cardNumber.formatted) return cardNumber.formatted;
    if (cardNumber.raw) return cardNumber.raw;
    return '';
  }
  
  return String(cardNumber);
};

/**
 * Store search history in localStorage
 * @param key The localStorage key
 * @param term The search term to add
 * @param maxItems Maximum number of items to store
 * @returns The updated history array
 */
export const addToSearchHistory = (key: string, term: string, maxItems: number = 10): string[] => {
  try {
    const savedHistory = localStorage.getItem(key);
    let history: string[] = [];
    
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // Remove if already exists
    history = history.filter(item => item !== term);
    
    // Add to the beginning
    history.unshift(term);
    
    // Limit the number of items
    history = history.slice(0, maxItems);
    
    localStorage.setItem(key, JSON.stringify(history));
    
    return history;
  } catch (e) {
    console.error('Error storing search history:', e);
    return [];
  }
};

/**
 * Get search history from localStorage
 * @param key The localStorage key
 * @returns Array of search history items
 */
export const getSearchHistory = (key: string): string[] => {
  try {
    const savedHistory = localStorage.getItem(key);
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    console.error('Error retrieving search history:', e);
    return [];
  }
};
