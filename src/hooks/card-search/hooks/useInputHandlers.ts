
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails, GameType, GAME_OPTIONS } from '../../../types/card';
import { isLikelyCardNumber } from '../../../utils/cardSearchUtils';
import { hasSignificantNameChange } from '../utils/nameChangeDetection';

interface UseInputHandlersProps {
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  previousCardNameRef: React.MutableRefObject<string>;
  setPotentialCardNumber: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useInputHandlers = ({ 
  setCardDetails, 
  previousCardNameRef, 
  setPotentialCardNumber 
}: UseInputHandlersProps) => {
  
  // Handle input changes with better validation and proper typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setCardDetails(prev => {
      const newDetails = { ...prev };
      
      if (name === 'game') {
        // Validate game type
        const validGameTypes: GameType[] = ['pokemon', 'japanese-pokemon'];
        const gameType = validGameTypes.includes(value as GameType) ? value as GameType : 'pokemon';
        
        const gameOption = GAME_OPTIONS.find(option => option.value === gameType);
        newDetails.game = gameType;
        newDetails.categoryId = gameOption?.categoryId || GAME_OPTIONS[0].categoryId;
        newDetails.set = ''; // Reset set when game changes
      } else if (name === 'name') {
        // Check if this is a significant name change
        const previousName = previousCardNameRef.current;
        const isSignificantChange = hasSignificantNameChange(previousName, value);
        
        console.log('Name change detected:', {
          previous: previousName,
          new: value,
          isSignificant: isSignificantChange
        });
        
        newDetails.name = value;
        
        // Auto-reset set selection on significant name changes
        if (isSignificantChange && newDetails.set) {
          console.log('Auto-resetting set selection due to significant name change');
          newDetails.set = '';
          toast.success('Set filter cleared for new search');
        }
        
        // Update the previous name reference
        previousCardNameRef.current = value;
        
        // Check if input might be a card number for name field
        if (isLikelyCardNumber(value) && !newDetails.number) {
          setPotentialCardNumber(value.trim());
        } else {
          setPotentialCardNumber(null);
        }
      } else if (name === 'set') {
        newDetails.set = value;
      } else if (name === 'number') {
        newDetails.number = value;
      }
      
      return newDetails;
    });
  }, [setCardDetails, previousCardNameRef, setPotentialCardNumber]);

  return { handleInputChange };
};
