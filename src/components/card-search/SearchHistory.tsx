
import React from 'react';
import { Clock, X } from 'lucide-react';

interface SearchHistoryProps {
  searchHistory: string[];
  onSelectHistoryItem: (item: string) => void;
  onClearHistory: () => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ 
  searchHistory, 
  onSelectHistoryItem, 
  onClearHistory 
}) => {
  if (searchHistory.length === 0) {
    return null;
  }
  
  return (
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
  );
};

export default SearchHistory;
