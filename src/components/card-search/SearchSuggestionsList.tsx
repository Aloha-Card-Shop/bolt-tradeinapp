
import React from 'react';
import { CardDetails } from '../../types/card';
import { getCardNumberString } from '../../utils/cardSearchUtils';

interface SearchSuggestionsListProps {
  suggestions: CardDetails[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: CardDetails) => void;
  searchTerm: string;
}

const SearchSuggestionsList: React.FC<SearchSuggestionsListProps> = ({ 
  suggestions, 
  isLoading, 
  onSelectSuggestion,
  searchTerm
}) => {
  if (isLoading) {
    return <div className="px-4 py-2 text-sm text-gray-500">Loading suggestions...</div>;
  }
  
  if (suggestions.length === 0 && searchTerm.length >= 2) {
    return <div className="px-4 py-2 text-sm text-gray-500">No suggestions found</div>;
  }
  
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <ul className="divide-y divide-gray-100">
      {suggestions.map((suggestion, index) => (
        <li 
          key={`${suggestion.name}-${suggestion.number}-${index}`}
          className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center transition-colors"
          onClick={() => onSelectSuggestion(suggestion)}
        >
          {suggestion.imageUrl && (
            <div className="w-12 h-12 mr-3 flex-shrink-0">
              <img 
                src={suggestion.imageUrl} 
                alt={suggestion.name}
                className="w-full h-full object-contain rounded-md shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-gray-900">{suggestion.name}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {suggestion.number && (
                <span className="inline-flex items-center bg-gray-100 px-2 py-0.5 rounded text-gray-800 mr-2">
                  #{getCardNumberString(suggestion.number)}
                </span>
              )}
              {suggestion.productId && (
                <span className="text-gray-500 text-xs">ID: {suggestion.productId}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SearchSuggestionsList;
