
import { useCallback } from 'react';
import { CardDetails } from '../../../types/card';
import { SetOption } from '../../useSetOptions';

interface UseSearchLogicProps {
  searchCards: (details: CardDetails, setOptions: SetOption[]) => Promise<string[]>;
  setOptions: SetOption[];
  filterSetOptions: (searchTerms: string[], foundSetIds: Set<string>) => void;
  isFiltered: boolean;
  setSearchResults: (results: any[]) => void;
  lastSearchRef: React.MutableRefObject<string>;
  searchCacheRef: React.MutableRefObject<Map<string, any>>;
  setIsSetFiltered: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSearchLogic = ({
  searchCards,
  setOptions,
  filterSetOptions,
  isFiltered,
  setSearchResults,
  lastSearchRef,
  searchCacheRef,
  setIsSetFiltered
}: UseSearchLogicProps) => {

  // Create a memoized search signature to prevent unnecessary re-renders
  const createSearchSignatureCallback = useCallback((details: CardDetails) => {
    return `${details.name || ''}|${details.number || ''}|${details.set || ''}|${details.game}`;
  }, []);

  // Perform search function with improved caching and duplicate prevention
  const performActualSearch = useCallback(async (details: CardDetails) => {
    const searchSignature = createSearchSignatureCallback(details);
    
    // Check if this is the same as the last search
    if (searchSignature === lastSearchRef.current) {
      console.log('Skipping duplicate search:', searchSignature);
      return;
    }
    
    // Check cache first
    const cachedResult = searchCacheRef.current.get(searchSignature);
    if (cachedResult) {
      console.log('Using cached search results for:', searchSignature);
      setSearchResults(cachedResult.results);
      return;
    }
    
    lastSearchRef.current = searchSignature;
    
    console.log('Executing search with criteria:', {
      name: details.name,
      number: details.number,
      set: details.set,
      game: details.game,
      categoryId: details.categoryId
    });
    
    try {
      // Search cards and get set IDs from results
      const foundSetIds = await searchCards(details, setOptions);
      
      const searchTerms = (details.name || '').toLowerCase().split(' ').filter(Boolean);
      
      // Build a Set<string> directly from found set IDs
      const setIdSet = new Set<string>(foundSetIds);
      
      filterSetOptions(searchTerms, setIdSet);
      
      // Record if sets are being filtered
      setIsSetFiltered(isFiltered);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchCards, setOptions, filterSetOptions, isFiltered, createSearchSignatureCallback, setSearchResults, lastSearchRef, searchCacheRef, setIsSetFiltered]);

  return {
    createSearchSignature: createSearchSignatureCallback,
    performActualSearch
  };
};
