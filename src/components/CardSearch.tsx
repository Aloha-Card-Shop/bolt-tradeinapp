
import React, { useState, useRef, useEffect } from 'react';
import { CardDetails, GAME_OPTIONS, CardNumberObject } from '../types/card';
import { Package, Search, Clock, X } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';

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
  searchInputRef
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

  // Function to safely get the string value from a CardNumberObject or string
  const getCardNumberValue = (): string => {
    if (!cardDetails.number) return '';
    
    if (typeof cardDetails.number === 'object') {
      return cardDetails.number.displayName || cardDetails.number.value || '';
    }
    
    return cardDetails.number;
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
        <div>
          <label htmlFor="game-select" className="block mb-1 text-sm font-medium text-gray-700">
            Game <span className="text-red-500">*</span>
          </label>
          <select
            id="game-select"
            name="game"
            value={cardDetails.game}
            onChange={onInputChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Card Name Input with Search Suggestions */}
        <div className="relative">
          <label htmlFor="card-name" className="block mb-1 text-sm font-medium text-gray-700">
            Card Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="card-name"
              type="text"
              ref={searchInputRef}
              placeholder="Start typing to search..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleFocus}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Suggestions dropdown */}
          {showSuggestions && (searchTerm.length >= 2 || suggestions.length > 0) && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {isLoadingSuggestions ? (
                <div className="px-4 py-2 text-sm text-gray-500">Loading suggestions...</div>
              ) : suggestions.length > 0 ? (
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li 
                      key={`${suggestion.name}-${index}`}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                      onClick={() => onSelectSuggestion(suggestion)}
                    >
                      {suggestion.imageUrl && (
                        <div className="w-8 h-8 mr-2 flex-shrink-0">
                          <img 
                            src={suggestion.imageUrl} 
                            alt={suggestion.name} 
                            className="w-full h-full object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{suggestion.name}</div>
                        {suggestion.number && (
                          <div className="text-xs text-gray-500">
                            #{typeof suggestion.number === 'object' 
                              ? suggestion.number.displayName || suggestion.number.value || ''
                              : suggestion.number}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchTerm.length >= 2 ? (
                <div className="px-4 py-2 text-sm text-gray-500">No suggestions found</div>
              ) : null}
            </div>
          )}
        </div>
        
        {/* Recent Searches */}
        {searchHistory.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Recent Searches</span>
              </div>
              <button 
                onClick={onClearHistory}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((item, index) => (
                <button
                  key={index}
                  className="bg-white text-gray-700 text-xs px-2 py-1 rounded border hover:bg-gray-100 flex items-center"
                  onClick={() => onSelectHistoryItem(item)}
                >
                  {item}
                  <X className="h-3 w-3 ml-1 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Set Selection */}
        <div>
          <label htmlFor="set-select" className="block mb-1 text-sm font-medium text-gray-700">
            Set Name
          </label>
          {isLoadingSets ? (
            <div className="py-2 text-sm text-gray-500">Loading sets...</div>
          ) : (
            <select 
              id="set-select"
              name="set"
              value={cardDetails.set || ''}
              onChange={onInputChange}
              disabled={!cardDetails.name || setOptions.length === 0}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-70"
            >
              <option value="">Select a set</option>
              {setOptions.map((set) => (
                <option key={set.id} value={set.name}>
                  {set.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Card Number Input */}
        <div>
          <label htmlFor="card-number" className="block mb-1 text-sm font-medium text-gray-700">
            Card Number
          </label>
          <input
            id="card-number"
            type="text"
            name="number"
            value={getCardNumberValue()}
            onChange={onInputChange}
            placeholder="e.g. 12 or 12/107"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter full or partial card number (with or without set number)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardSearch;
