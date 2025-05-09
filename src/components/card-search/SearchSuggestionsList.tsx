
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
                #{getCardNumberString(suggestion.number)}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SearchSuggestionsList;
