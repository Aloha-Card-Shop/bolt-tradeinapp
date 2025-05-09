
// Card search utility functions

/**
 * Format card number for better search matching
 * @param cardNumber The card number to format
 * @returns Formatted card number
 */
export const formatCardNumberForSearch = (cardNumber: string | any): string => {
  // Check if cardNumber is an object and extract the value safely
  if (typeof cardNumber === 'object' && cardNumber !== null) {
    cardNumber = cardNumber.value || cardNumber.displayName || '';
  }

  // Clean the card number to remove spaces and convert to lowercase
  const cleanNumber = String(cardNumber).trim().toLowerCase();
  
  // Log the card number before and after formatting for debugging
  console.log('Original card number:', cardNumber, 'Formatted:', cleanNumber);
  
  return cleanNumber;
};

/**
 * Creates filters for the card search query
 * @param searchTerms Array of search terms for card name
 * @param formattedNumber Formatted card number (if any)
 * @returns Object containing filter strings for the query
 */
export const createSearchFilters = (searchTerms: string[], formattedNumber?: string) => {
  let filters = [];
  
  // Add name filters
  if (searchTerms.length > 0) {
    const nameFilters = searchTerms.map(term => 
      `name.ilike.%${term}%`
    );
    // Combine name filters with AND logic
    filters.push(`and(${nameFilters.join(',')})`);
  }
  
  // Add card number filter if present
  if (formattedNumber) {
    let cardNumberFilters = [];
    
    // Search in attributes->>'card_number'
    cardNumberFilters.push(`attributes->>'card_number'.ilike.%${formattedNumber}%`);
    
    // Also search in attributes->>'Number' (some records use this field)
    cardNumberFilters.push(`attributes->>'Number'.ilike.%${formattedNumber}%`);
    
    // Search in clean_name which may contain the number
    cardNumberFilters.push(`clean_name.ilike.%${formattedNumber}%`);
    
    // Handle cases where number might be a prefix
    // This helps find cards like "12/107" when searching for "12"
    cardNumberFilters.push(`attributes->>'card_number'.ilike.${formattedNumber}/%`);
    cardNumberFilters.push(`attributes->>'Number'.ilike.${formattedNumber}/%`);
    
    // Combine all card number filters with OR logic
    filters.push(`or(${cardNumberFilters.join(',')})`);
  }
  
  return filters;
};
