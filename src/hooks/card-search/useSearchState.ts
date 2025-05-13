
import { useState, useRef, useCallback } from 'react';
import { CardDetails } from '../../types/card';

/**
 * Custom hook to manage search state and caching
 */
export const useSearchState = () => {
  // Track if a search should be performed automatically
  const [shouldSearch, setShouldSearch] = useState(false);
  
  // Track if sets are filtered
  const [isSetFiltered, setIsSetFiltered] = useState(false);
  
  // Store the last search query to avoid duplicate searches
  const lastSearchRef = useRef<string>('');
  
  // Cache for recent search results to avoid redundant DB queries
  const searchCacheRef = useRef<Map<string, any>>(new Map());
  
  // Track if this is the initial page load
  const isInitialLoad = useRef(true);

  // Perform a manual search - should only happen when explicitly triggered
  const performSearch = useCallback((cardDetails: CardDetails) => {
    console.log("Manual search triggered with:", cardDetails);
    
    // Only proceed if we have valid search criteria
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      // Mark that we're no longer in initial load state
      isInitialLoad.current = false;
      setShouldSearch(true);
    }
  }, []);

  return {
    shouldSearch,
    setShouldSearch,
    isSetFiltered,
    setIsSetFiltered,
    lastSearchRef,
    searchCacheRef,
    isInitialLoad,
    performSearch
  };
};

