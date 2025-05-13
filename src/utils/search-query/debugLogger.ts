
/**
 * Utility functions for search query debugging and logging
 */

// Debug mode flag that can be toggled globally
export const DEBUG_MODE = true;

/**
 * Log search criteria in detail
 * @param cardDetails Card details used for the search
 * @param page Current page number
 */
export const logSearchCriteria = (cardDetails: any, page: number) => {
  if (!DEBUG_MODE) return;
  
  // Convert any CardNumberObject to string for logging
  const numberStr = cardDetails.number ? 
                  (typeof cardDetails.number === 'object' ? 
                    getCardNumberString(cardDetails.number) : 
                    cardDetails.number) : 'not specified';
                    
  console.log('📝 Search initiated with criteria:', {
    name: cardDetails.name || 'not specified',
    number: numberStr,
    set: cardDetails.set || 'not specified',
    categoryId: cardDetails.categoryId || 'not specified',
    page
  });
};

/**
 * Log performance metrics for search queries
 * @param startTime Performance start time
 */
export const logPerformance = (startTime: number) => {
  if (!DEBUG_MODE) return;
  const endTime = performance.now();
  console.log(`🕒 Query execution time: ${(endTime - startTime).toFixed(2)}ms`);
};

/**
 * Log raw response from the database
 * @param data Response data
 * @param error Response error
 * @param count Response count
 */
export const logRawResponse = (data: any, error: any, count: number | null) => {
  if (!DEBUG_MODE) return;
  
  console.log('📊 Supabase response:', { 
    success: !error, 
    count: count || 'unknown',
    resultCount: data?.length || 0,
    error: error ? `${error.code}: ${error.message}` : null
  });
  
  if (data && data.length > 0) {
    console.log('Sample result item:', data[0]);
    if (data[0].attributes) {
      console.log('Sample attributes structure:', data[0].attributes);
    }
  } else {
    console.log('No results returned from query');
  }
};

/**
 * Log search query details
 * @param queryFilter SQL filter string
 * @param params Search parameters
 */
export const debugLogQuery = (queryFilter: string, params: any) => {
  if (!DEBUG_MODE) return;
  
  console.log('🔍 Generated SQL filter:', queryFilter);
  console.log('🔍 Search parameters:', params);
};

/**
 * Log information about formatted search results
 * @param formattedResults Formatted card results
 */
export const logFormattedResults = (formattedResults: any[]) => {
  if (!DEBUG_MODE) return;
  
  console.log(`✅ Found ${formattedResults.length} formatted card results`);
  if (formattedResults.length > 0) {
    console.log('First formatted card:', formattedResults[0]);
  }
};

/**
 * Log information about loading more results
 * @param page Page number being loaded
 */
export const logLoadingMore = (page: number) => {
  if (!DEBUG_MODE) return;
  console.log(`📜 Loading more results - page ${page + 1}`);
};

/**
 * Log additional loaded results count
 * @param count Number of additional results loaded
 */
export const logAdditionalResults = (count: number) => {
  if (!DEBUG_MODE) return;
  console.log(`Loaded ${count} additional results`);
};

// Helper function to get string representation of card number
const getCardNumberString = (cardNumber: any): string => {
  if (!cardNumber) return '';
  
  if (typeof cardNumber === 'object') {
    return cardNumber.displayName || cardNumber.value || '';
  }
  
  return String(cardNumber);
};
