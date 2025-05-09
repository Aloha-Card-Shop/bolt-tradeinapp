
import React from 'react';

interface CardNumberSuggestionProps {
  potentialCardNumber: string | null;
  onUseAsCardNumber: () => void;
}

const CardNumberSuggestion: React.FC<CardNumberSuggestionProps> = ({ 
  potentialCardNumber, 
  onUseAsCardNumber 
}) => {
  if (!potentialCardNumber) {
    return null;
  }
  
  return (
    <div className="mt-1 p-2 bg-blue-50 text-sm rounded-md flex items-center justify-between">
      <span>Looking for card #{potentialCardNumber}?</span>
      <button 
        onClick={onUseAsCardNumber}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        Search by number
      </button>
    </div>
  );
};

export default CardNumberSuggestion;
