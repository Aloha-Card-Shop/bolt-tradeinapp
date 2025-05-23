import { useState, useEffect, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';
import { useCardSuggestions } from './useCardSuggestions';
import { isLikelyCardNumber } from '../utils/cardSearchUtils';
import { toast } from 'react-hot-toast';

// Increased debounce timeouts to reduce race conditions
const SEARCH_DEBOUNCE_MS = 200; // Increased from 50ms
const SUGGESTION_DEBOUNCE_MS = 200; // Increased from 75ms

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  // Always keep suggestions hidden - we're disabling the dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Track if a search should be performed automatically
  const [shouldSearch, setShouldSearch] = useState(false);
  
  // Ref to store debounce timer IDs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if sets are filtered
  const [isSetFiltered, setIsSetFiltered] = useState(false);
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions, showAllSets, isFiltered } = useSetOptions();
  
  const { 
    searchResults, 
    setSearchResults,
    isSearching, 
    searchCards, 
    hasMoreResults, 
    loadMoreResults,
    totalResults
  } = useCardSearchQuery();
  
  const { 
    suggestions, 
    isLoading: isLoadingSuggestions, 
    fetchSuggestions,
    recentSearches
  } = useCardSuggestions();

  // Detect potentially abandoned searches (like a card number in the name field)
  const [potentialCardNumber, setPotentialCardNumber] = useState<string | null>(null);

  // Store the last search query to avoid duplicate searches
  const lastSearchRef = useRef<string>('');
  
  // Cache for recent search results to avoid redundant DB queries
  const searchCacheRef = useRef<Map<string, any>>(new Map());

  // New function to add certificate results to search results
  const addCertificateToResults = useCallback((certificateCard: CardDetails) => {
    // Make sure the certificate card has required fields
    if (!certificateCard) {
      console.error("Invalid certificate card:", certificateCard);
      return;
    }

    // Ensure the certificate has an ID to use as productId if not present
    if (!certificateCard.productId && certificateCard.certification?.certNumber) {
      certificateCard.productId = certificateCard.certification.certNumber;
    }

    console.log("Adding certificate to results:", certificateCard);

    // Add the certificate to the beginning of the results array
    setSearchResults(prevResults => {
      // Check if this certificate is already in the results
      const existingIndex = prevResults.findIndex(
        card => card.isCertified && 
               card.certification?.certNumber === certificateCard.certification?.certNumber
      );
      
      if (existingIndex >= 0) {
        // Replace the existing entry if it exists
        const newResults = [...prevResults];
        newResults[existingIndex] = certificateCard;
        return newResults;
      }
      
      // Otherwise add to the beginning
      toast.success(`Found certificate: ${certificateCard.name} (PSA ${certificateCard.certification?.grade || '?'})`);
      return [certificateCard, ...prevResults];
    });
  }, [setSearchResults]);

  // Perform search when shouldSearch is true
  useEffect(() => {
    if (shouldSearch) {
      const performSearch = async () => {
        // Create a search signature to check against previous searches
        const searchSignature = `${cardDetails.name}|${cardDetails.number}|${cardDetails.set}|${cardDetails.game}`;
        
        // Check if we have cached results for this signature
        const cachedResult = searchCacheRef.current.get(searchSignature);
        if (cachedResult) {
          console.log('Using cached search results for:', searchSignature);
          // Handle cached results (this would need proper implementation)
          // For now, we'll still search but could optimize this further
        }
        
        if (searchSignature !== lastSearchRef.current) {
          lastSearchRef.current = searchSignature;
          
          console.log('Executing search with criteria:', {
            name: cardDetails.name,
            number: cardDetails.number,
            set: cardDetails.set,
            game: cardDetails.game,
            categoryId: cardDetails.categoryId
          });
          
          // Search cards and get set IDs from results
          const foundSetIds = await searchCards(cardDetails, setOptions);
          
          // Convert string array to Set<number> for filterSetOptions
          const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
          
          // Create a new Set from the string array, converting strings to numbers
          const setIdSet = new Set<number>();
          foundSetIds.forEach(id => {
            const numericId = parseInt(id, 10);
            if (!isNaN(numericId)) {
              setIdSet.add(numericId);
            }
          });
          
          filterSetOptions(searchTerms, setIdSet);
          
          // Record if sets are being filtered
          setIsSetFiltered(isFiltered);
        }
        
        setShouldSearch(false);
      };
      
      performSearch();
    }
  }, [shouldSearch, cardDetails, searchCards, setOptions, filterSetOptions, isFiltered]);

  // Modified search behavior to better support set-only searches
  useEffect(() => {
    // Clear previous suggestion debounce
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    // Still fetch suggestions for historical data, but don't show the dropdown
    if (cardDetails.name && cardDetails.name.length >= 1) {
      suggestionDebounceRef.current = setTimeout(() => {
        // Make sure categoryId is provided and is a number
        const categoryIdToUse = cardDetails.categoryId ?? GAME_OPTIONS[0].categoryId;
        fetchSuggestions(cardDetails.name, cardDetails.game, categoryIdToUse);
        
        // Check if input might be a card number
        if (isLikelyCardNumber(cardDetails.name) && !cardDetails.number) {
          setPotentialCardNumber(cardDetails.name.trim());
        } else {
          setPotentialCardNumber(null);
        }
      }, SUGGESTION_DEBOUNCE_MS);
    } else {
      // If name is cleared, reset potential card number
      setPotentialCardNumber(null);
    }
    
    // Clear previous search debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Always update set options to show all sets when no name search is active
    if (!cardDetails.name) {
      const searchTerms: string[] = [];
      filterSetOptions(searchTerms, new Set<number>());
    }
    
    // Start search with any valid criteria, including set-only searches
    const hasSearchCriteria = 
      (cardDetails.name && cardDetails.name.length >= 1) || 
      cardDetails.number || 
      cardDetails.set;
      
    if (hasSearchCriteria) {
      searchDebounceRef.current = setTimeout(() => {
        console.log("Auto-triggering search for:", cardDetails);
        setShouldSearch(true);
      }, SEARCH_DEBOUNCE_MS);
    }
    
    return () => {
      if (suggestionDebounceRef.current) {
        clearTimeout(suggestionDebounceRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [cardDetails.name, cardDetails.number, cardDetails.set, cardDetails.game, cardDetails.categoryId, fetchSuggestions, filterSetOptions]);

  // Improved handleInputChange to better detect potential card numbers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'game') {
      const gameOption = GAME_OPTIONS.find(option => option.value === value as GameType);
      setCardDetails(prev => ({
        ...prev,
        game: value as GameType,
        categoryId: gameOption?.categoryId,
        set: ''
      }));
      
      // Trigger search immediately when game changes
      setTimeout(() => setShouldSearch(true), 50);
    } else if (name === 'name') {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Check if input might be a card number
      if (isLikelyCardNumber(value) && !cardDetails.number) {
        setPotentialCardNumber(value.trim());
      } else {
        setPotentialCardNumber(null);
      }
      
      // Reset set selection if name is cleared
      if (!value) {
        setCardDetails(prev => ({ ...prev, name: '' }));
        setPotentialCardNumber(null);
      }
    } else if (name === 'set') {
      // Updated set handling to perform search immediately
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Trigger search immediately when set changes
      setTimeout(() => setShouldSearch(true), 50);
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Also trigger search for other fields like number
      if (name === 'number' && value) {
        setTimeout(() => setShouldSearch(true), 50);
      }
    }
  };

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
    
    // Trigger search immediately
    setTimeout(() => setShouldSearch(true), 50);
  }, [potentialCardNumber]);

  // Perform a manual search
  const performSearch = useCallback(() => {
    console.log("Manual search triggered with:", cardDetails);
    if (cardDetails.name || cardDetails.number || cardDetails.set) {
      setShouldSearch(true);
    }
  }, [cardDetails]);

  // Add new handleShowAllSets function
  const handleShowAllSets = useCallback(() => {
    showAllSets();
    setIsSetFiltered(false);
  }, [showAllSets]);

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
  }, []);

  // Add a new function to completely clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    resetSearch();
    // Instead of directly using setTotalResults and setHasMoreResults (which don't exist),
    // we need to perform another empty search to reset those values in useCardSearchQuery
    setTimeout(() => {
      searchCards({
        name: '',
        set: '',
        number: '',
        game: cardDetails.game,
        categoryId: cardDetails.categoryId
      }, setOptions);
    }, 50);
    toast.success('Search results cleared');
  }, [resetSearch, setSearchResults, searchCards, cardDetails.game, cardDetails.categoryId, setOptions]);

  return {
    cardDetails,
    searchResults,
    setOptions: filteredSetOptions,
    isLoadingSets,
    isSearching,
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    setShowSuggestions,
    searchHistory: recentSearches,
    potentialCardNumber,
    handleInputChange,
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    handleUseAsCardNumber,
    performSearch,
    handleShowAllSets,
    isSetFiltered,
    addCertificateToResults,
    clearSearchResults
  };
};
