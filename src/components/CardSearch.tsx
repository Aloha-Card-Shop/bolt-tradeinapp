
import React, { useState, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { Package } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';

// Import the smaller component pieces
import SearchGameSelect from './card-search/SearchGameSelect';
import SearchNameInput from './card-search/SearchNameInput';
import CardNumberSuggestion from './card-search/CardNumberSuggestion';
import SearchSetSelect from './card-search/SearchSetSelect';
import CardNumberInput from './card-search/CardNumberInput';

interface CardSearchProps {
  cardDetails: CardDetails;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: SetOption[];
  isLoadingSets: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  potentialCardNumber?: string | null;
  onUseAsCardNumber?: () => void;
  performSearch?: () => void; // Added this prop to match what's being passed in MainApp.tsx
}

const CardSearch: React.FC<CardSearchProps> = ({ 
  cardDetails, 
  onInputChange, 
  setOptions, 
  isLoadingSets,
  searchInputRef,
  potentialCardNumber = null,
  onUseAsCardNumber = () => {},
  performSearch = () => {} // Add default value to make it optional
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setSearchTerm(cardDetails.name || '');
  }, [cardDetails.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'name',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(event);
  };

  // Added a handleKeyDown function to use performSearch
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="ml-3 text-xl font-semibold text-gray-800">Find Cards</h2>
      </div>
      
      <div className="space-y-4">
        {/* Game Selection */}
        <SearchGameSelect 
          selectedGame={cardDetails.game} 
          onChange={onInputChange} 
        />

        {/* Card Name Input - Auto-searches as user types */}
        <div className="relative">
          <SearchNameInput 
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Pass the handleKeyDown function
            inputRef={searchInputRef}
          />
          
          {/* Card number suggestion */}
          <CardNumberSuggestion 
            potentialCardNumber={potentialCardNumber}
            onUseAsCardNumber={onUseAsCardNumber}
          />
        </div>
        
        {/* Set Selection */}
        <SearchSetSelect 
          selectedSet={cardDetails.set || ''}
          setOptions={setOptions}
          isLoading={isLoadingSets}
          disabled={!cardDetails.name && !cardDetails.number}
          onChange={onInputChange}
        />

        {/* Card Number Input */}
        <CardNumberInput 
          cardNumber={cardDetails.number} 
          onChange={onInputChange} 
          onKeyDown={handleKeyDown} // Also add Enter key behavior to card number input
        />
      </div>
    </div>
  );
};

export default CardSearch;
