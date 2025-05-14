
import { useState, useRef, useCallback } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../../types/card';
import { isLikelyCardNumber } from '../../utils/card-number/variants';

/**
 * Custom hook for managing card search input state and changes
 */
export const useCardInput = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [potentialCardNumber, setPotentialCardNumber] = useState<string | null>(null);
  
  // Handle input changes with improved type detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'game') {
      const gameOption = GAME_OPTIONS.find(option => option.value === value as GameType);
      setCardDetails(prev => ({
        ...prev,
        game: value as GameType,
        categoryId: gameOption?.categoryId,
        set: ''
      }));
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
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  }, [cardDetails.number]);

  // Handle using a detected card number
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
  }, [potentialCardNumber]);

  // Reset search state
  const resetSearch = useCallback(() => {
    setCardDetails(prev => ({
      name: '',
      set: '',
      number: '',
      game: prev.game,
      categoryId: prev.categoryId
    }));
    setPotentialCardNumber(null);
  }, []);

  return {
    cardDetails,
    setCardDetails,
    searchInputRef,
    potentialCardNumber,
    handleInputChange,
    handleUseAsCardNumber,
    resetSearch,
  };
};
