import React, { useState, useRef, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { Package } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';

// Import the smaller component pieces
import SearchGameSelect from './card-search/SearchGameSelect';
import SearchNameInput from './card-search/SearchNameInput';
import CardNumberSuggestion from './card-search/CardNumberSuggestion';
import SearchHistory from './card-search/SearchHistory';
import SearchSetSelect from './card-search/SearchSetSelect';
import CardNumberInput from './card-search/CardNumberInput';

interface CardSearchProps {
  cardDetails: CardDetails;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: SetOption[];
  isLoadingSets: boolean;
  suggestions?: CardDetails[];
  isLoadingSuggestions?: boolean;
  showSuggestions?: boolean;
  setShowSuggestions?: (show: boolean) => void;
  onSelectSuggestion?: (suggestion: CardDetails) => void;
  searchHistory?: string[];
  onSelectHistoryItem?: (item: string) => void;
  onClearHistory?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  potentialCardNumber?: string | null;
  onUseAsCardNumber?: () => void;
}

const CardSearch: React.FC<CardSearchProps> = ({ 
  cardDetails, 
  onInputChange, 
  setOptions, 
  isLoadingSets,
  suggestions = [],
  isLoadingSuggestions = false,
  showSuggestions = false,
  setShowSuggestions = () => {},
  onSelectSuggestion = () => {},
  searchHistory = [],
  onSelectHistoryItem = () => {},
  onClearHistory = () => {},
  searchInputRef,
  potentialCardNumber = null,
  onUseAsCardNumber = () => {}
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

  // Simplified keyboard handler - we don't need to manage dropdown visibility anymore
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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

        {/* Card Name Input - removed suggestions dropdown */}
        <div className="relative">
          <SearchNameInput 
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {}} // Empty function, we don't show dropdown on focus anymore
            onKeyDown={handleKeyDown}
            inputRef={searchInputRef}
          />
          
          {/* Card number suggestion - keep this feature */}
          <CardNumberSuggestion 
            potentialCardNumber={potentialCardNumber}
            onUseAsCardNumber={onUseAsCardNumber}
          />
        </div>
        
        {/* Recent Searches - keep this feature */}
        <SearchHistory 
          searchHistory={searchHistory}
          onSelectHistoryItem={onSelectHistoryItem}
          onClearHistory={onClearHistory}
        />
        
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
        />
      </div>
    </div>
  );
};

export default CardSearch;
