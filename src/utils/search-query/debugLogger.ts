
import { CardDetails } from "../../types/card";
import { SearchParams } from "./types";

/**
 * Logs search criteria for debugging
 */
export const logSearchCriteria = (cardDetails: CardDetails, page: number) => {
  console.log(`🔍 Searching with criteria:`, {
    name: cardDetails.name,
    set: cardDetails.set,
    number: cardDetails.number,
    game: cardDetails.game,
    page
  });
};

/**
 * Logs performance metrics for search operations
 */
export const logPerformance = (startTime: number) => {
  const endTime = performance.now();
  console.log(`⏱️ Search executed in ${Math.round(endTime - startTime)}ms`);
};

/**
 * Logs raw database response for debugging
 */
export const logRawResponse = (data: any, error: any, count: number | null) => {
  if (error) {
    console.error('❌ Search error:', error);
  } else {
    console.log(`✅ Found ${data?.length || 0} results${count !== null ? ` (total: ${count})` : ''}`);
  }
};

/**
 * Logs formatted results for debugging
 */
export const logFormattedResults = (results: CardDetails[]) => {
  console.log(`🔢 Formatted results: ${results.length}`);
  if (results.length > 0) {
    console.log('Example result:', results[0]);
  }
};

/**
 * Logs the generated query filter string for debugging
 */
export const debugLogQuery = (filterString: string, params: SearchParams) => {
  console.log('🔍 Generated filter:', filterString);
  console.log('🔍 From params:', params);
};

/**
 * Log when loading more results (pagination)
 */
export const logLoadingMore = (page: number) => {
  console.log(`📄 Loading more results (page ${page + 1})`);
};

/**
 * Log additional results loaded
 */
export const logAdditionalResults = (count: number) => {
  console.log(`✅ Loaded ${count} additional results`);
};
