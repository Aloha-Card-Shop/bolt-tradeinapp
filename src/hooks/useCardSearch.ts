
import { useState, useEffect } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { useSetOptions } from './useSetOptions';
import { useCardSearchQuery } from './useCardSearchQuery';

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  const { setOptions, filteredSetOptions, isLoadingSets, filterSetOptions } = useSetOptions(
    cardDetails.game,
    cardDetails.categoryId
  );
  
  const { searchResults, isSearching, searchCards } = useCardSearchQuery();

  // Search for cards and filter sets when search criteria changes
  useEffect(() => {
    // Debounce the search to avoid too many requests
    const timer = setTimeout(async () => {
      // Get search terms for filtering sets
      const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
      
      // Search cards and get set IDs from results
      const foundSetIds = await searchCards(cardDetails, setOptions);
      
      // Filter set options based on search results
      filterSetOptions(searchTerms, foundSetIds);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [cardDetails.name, cardDetails.game, cardDetails.set, cardDetails.number, cardDetails.categoryId, setOptions]);

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
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Reset set selection if name is cleared
      if (name === 'name' && !value) {
        setCardDetails(prev => ({ ...prev, set: '' }));
      }
    }
  };

  const resetSearch = () => {
    setCardDetails({
      name: '',
      set: '',
      number: '',
      game: cardDetails.game,
      categoryId: cardDetails.categoryId
    });
  };

  return {
    cardDetails,
    searchResults,
    setOptions: filteredSetOptions,
    isLoadingSets,
    isSearching,
    handleInputChange,
    resetSearch
  };
};
