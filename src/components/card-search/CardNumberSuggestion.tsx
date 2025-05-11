
import React from 'react';

interface CardNumberSuggestionProps {
  potentialCardNumber: string | null;
  onUseAsCardNumber: () => void;
  isDetecting?: boolean;
}

const CardNumberSuggestion: React.FC<CardNumberSuggestionProps> = ({ 
  potentialCardNumber, 
  onUseAsCardNumber,
  isDetecting = false 
}) => {
  if (!potentialCardNumber) {
    return null;
  }
  
  return (
    <div className="mt-1 p-2 bg-blue-50 text-sm rounded-md flex items-center justify-between">
      <span>
        {isDetecting ? (
          <span className="font-medium">Detecting number format...</span>
        ) : (
          <>
            <span className="font-medium">#{potentialCardNumber}</span> looks like a card number
          </>
        )}
      </span>
      <button 
        onClick={onUseAsCardNumber}
        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        disabled={isDetecting}
      >
        Search as card number
      </button>
    </div>
  );
};

export default CardNumberSuggestion;
