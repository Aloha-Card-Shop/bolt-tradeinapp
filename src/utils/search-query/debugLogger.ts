
import { SearchParams } from './types';

/**
 * Log search query parameters for debugging purposes
 * @param query The SQL filter string
 * @param params Search parameters used to generate the query
 */
export const debugLogQuery = (query: string, params: SearchParams) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('Card Search Query');
    console.log('Filter:', query || '(No filters)');
    console.log('Parameters:', params);
    console.groupEnd();
  }
};

/**
 * Log search criteria with detailed information
 * @param cardDetails Card details used for search
 * @param page Current page number
 */
export const logSearchCriteria = (cardDetails: any, page: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('Search Criteria');
    console.log('Card Details:', cardDetails);
    console.log('Page:', page);
    console.groupEnd();
  }
};

/**
 * Log performance metrics for search execution
 * @param startTime Performance start time
 */
export const logPerformance = (startTime: number) => {
  if (process.env.NODE_ENV === 'development') {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(`Search execution time: ${executionTime.toFixed(2)}ms`);
  }
};

/**
 * Log raw response data from the search query
 * @param data Response data
 * @param error Any errors that occurred
 * @param count Total count if available
 */
export const logRawResponse = (data: any, error: any, count: number | null) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('Search Response');
    console.log('Count:', count);
    console.log('Data:', data);
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();
  }
};

/**
 * Log formatted search results
 * @param results Formatted search results
 */
export const logFormattedResults = (results: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('Formatted Results');
    console.log('Results Count:', results.length);
    console.log('First Result:', results[0] || 'No results');
    console.groupEnd();
  }
};

/**
 * Log when loading more results (for pagination)
 * @param page Page number being loaded
 */
export const logLoadingMore = (page: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Loading more results (page ${page})...`);
  }
};

/**
 * Log information about additional results loaded
 * @param count Number of additional results loaded
 */
export const logAdditionalResults = (count: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Loaded ${count} additional results`);
  }
};
