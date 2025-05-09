
import React, { useState, useRef, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { Package } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';

// Import the smaller component pieces
import SearchGameSelect from './card-search/SearchGameSelect';
import SearchNameInput from './card-search/SearchNameInput';
import SearchSuggestionsList from './card-search/SearchSuggestionsList';
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
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setSearchTerm(cardDetails.name || '');
  }, [cardDetails.name]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowSuggestions]);

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

  const handleFocus = () => {
    if (searchTerm && searchTerm.length >= 2) {
      setShowSuggestions(true);
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

        {/* Card Name Input with Search Suggestions */}
        <div className="relative">
          <SearchNameInput 
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            inputRef={searchInputRef}
          />
          
          {/* Card number suggestion */}
          <CardNumberSuggestion 
            potentialCardNumber={potentialCardNumber}
            onUseAsCardNumber={onUseAsCardNumber}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && (searchTerm.length >= 2 || suggestions.length > 0) && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <SearchSuggestionsList 
                suggestions={suggestions}
                isLoading={isLoadingSuggestions}
                onSelectSuggestion={onSelectSuggestion}
                searchTerm={searchTerm}
              />
            </div>
          )}
        </div>
        
        {/* Recent Searches */}
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
