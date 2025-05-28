import { useState, useRef } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../../../types/card';

export const useSearchState = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  // Add card type state for graded vs raw search mode
  const [cardType, setCardType] = useState<'raw' | 'graded'>('raw');
  
  // Always keep suggestions hidden - we're disabling the dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Ref to store debounce timer IDs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track previous card name for detecting significant changes
  const previousCardNameRef = useRef<string>('');
  
  // Track if sets are filtered
  const [isSetFiltered, setIsSetFiltered] = useState(false);

  // Detect potentially abandoned searches (like a card number in the name field)
  const [potentialCardNumber, setPotentialCardNumber] = useState<string | null>(null);

  // Store the last search query to avoid duplicate searches
  const lastSearchRef = useRef<string>('');
  
  // Cache for recent search results to avoid redundant DB queries
  const searchCacheRef = useRef<Map<string, any>>(new Map());

  return {
    cardDetails,
    setCardDetails,
    cardType,
    setCardType,
    showSuggestions,
    setShowSuggestions,
    searchInputRef,
    searchDebounceRef,
    suggestionDebounceRef,
    previousCardNameRef,
    isSetFiltered,
    setIsSetFiltered,
    potentialCardNumber,
    setPotentialCardNumber,
    lastSearchRef,
    searchCacheRef
  };
};
