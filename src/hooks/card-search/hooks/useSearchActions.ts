
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../../../types/card';

interface UseSearchActionsProps {
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  potentialCardNumber: string | null;
  setPotentialCardNumber: React.Dispatch<React.SetStateAction<string | null>>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  performActualSearch: (details: CardDetails) => Promise<void>;
  cardDetails: CardDetails;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSetFiltered: React.Dispatch<React.SetStateAction<boolean>>;
  lastSearchRef: React.MutableRefObject<string>;
  searchCacheRef: React.MutableRefObject<Map<string, any>>;
  previousCardNameRef: React.MutableRefObject<string>;
  setSearchResults: (results: any[]) => void;
  showAllSets: () => void;
}

export const useSearchActions = ({
  setCardDetails,
  potentialCardNumber,
  setPotentialCardNumber,
  searchInputRef,
  performActualSearch,
  cardDetails,
  setShowSuggestions,
  setIsSetFiltered,
  lastSearchRef,
  searchCacheRef,
  previousCardNameRef,
  setSearchResults,
  showAllSets
}: UseSearchActionsProps) => {

  // Improved use potential card number function
  const handleUseAsCardNumber = useCallback(() => {
    if (!potentialCardNumber) return;
    
    setCardDetails(prev => ({
      ...prev,
      name: '', // Clear the name field
      number: potentialCardNumber // Move the value to card number field
    }));
    setPotentialCardNumber(null);
    
    // Focus back on the name input for better UX
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [potentialCardNumber, setCardDetails, setPotentialCardNumber, searchInputRef]);

  // Perform a manual search
  const performSearch = useCallback(() => {
    console.log("Manual search triggered with:", cardDetails);
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      performActualSearch(cardDetails);
    }
  }, [cardDetails, performActualSearch]);

  // Add new handleShowAllSets function
  const handleShowAllSets = useCallback(() => {
    showAllSets();
    setIsSetFiltered(false);
  }, [showAllSets, setIsSetFiltered]);

  const resetSearch = useCallback(() => {
    setCardDetails(prev => ({
      name: '',
      set: '',
      number: '',
      game: prev.game,
      categoryId: prev.categoryId
    }));
    setShowSuggestions(false);
    setPotentialCardNumber(null);
    setIsSetFiltered(false);
    lastSearchRef.current = '';
    searchCacheRef.current.clear();
    // Reset the previous name reference
    previousCardNameRef.current = '';
  }, [setCardDetails, setShowSuggestions, setPotentialCardNumber, setIsSetFiltered, lastSearchRef, searchCacheRef, previousCardNameRef]);

  // Add a new function to completely clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    resetSearch();
    toast.success('Search results cleared');
  }, [resetSearch, setSearchResults]);

  return {
    handleUseAsCardNumber,
    performSearch,
    handleShowAllSets,
    resetSearch,
    clearSearchResults
  };
};
