
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
 * Creates filters for the card search query with improved ranking
 * @param searchTerms Array of search terms for card name
 * @param formattedNumber Formatted card number (if any)
 * @returns Array of filter strings for the query
 */
export const createSearchFilters = (searchTerms: string[], formattedNumber?: string) => {
  let filters = [];
  
  // Add name filters with enhanced search capabilities and ranking
  if (searchTerms.length > 0) {
    // Create exact match filters first (higher priority)
    const exactMatchFilters = searchTerms.map(term => {
      return `name.ilike.${term}%`; // Starts with term (highest priority)
    });
    
    if (exactMatchFilters.length > 0) {
      filters.push(`or(${exactMatchFilters.join(',')})`);
    }
    
    // Then add partial match filters (lower priority)
    const nameFilters = searchTerms.map(term => {
      const termFilters = [
        // Search in the regular name field
        `name.ilike.%${term}%`,
        
        // Also search in clean_name field which typically has no special characters
        `clean_name.ilike.%${term}%`
      ];
      // Combine each term's filters with OR logic
      return `or(${termFilters.join(',')})`;
    });
    
    // Combine name filters with AND logic (each term must be found in either name or clean_name)
    if (nameFilters.length > 0) {
      filters.push(`and(${nameFilters.join(',')})`);
    }
  }
  
  // Add card number filter if present
  if (formattedNumber) {
    let cardNumberFilters = [];
    
    // Exact match first (highest priority)
    cardNumberFilters.push(`attributes->>'card_number'.eq.${formattedNumber}`);
    cardNumberFilters.push(`attributes->>'Number'.eq.${formattedNumber}`);
    
    // Then partial matches
    cardNumberFilters.push(`attributes->>'card_number'.ilike.%${formattedNumber}%`);
    cardNumberFilters.push(`attributes->>'Number'.ilike.%${formattedNumber}%`);
    
    // Handle cases where number might be a prefix
    cardNumberFilters.push(`attributes->>'card_number'.ilike.${formattedNumber}/%`);
    cardNumberFilters.push(`attributes->>'Number'.ilike.${formattedNumber}/%`);
    
    // Add new filters to match the number before the slash
    // For example, if the card number is "167/159", this will match a search for "167"
    cardNumberFilters.push(`attributes->>'card_number'.ilike.${formattedNumber}/%`);
    cardNumberFilters.push(`attributes->>'Number'.ilike.${formattedNumber}/%`);
    
    // Combine all card number filters with OR logic
    filters.push(`or(${cardNumberFilters.join(',')})`);
  }
  
  return filters;
};

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
 * Store search history in localStorage
 * @param key The localStorage key
 * @param term The search term to add
 * @param maxItems Maximum number of items to store
 */
export const addToSearchHistory = (key: string, term: string, maxItems: number = 10) => {
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
