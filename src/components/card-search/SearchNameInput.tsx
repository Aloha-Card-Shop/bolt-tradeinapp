
import React from 'react';
import { Search, Bug } from 'lucide-react';

interface SearchNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  onSearch?: () => void; // Added prop for manual search trigger
}

const SearchNameInput: React.FC<SearchNameInputProps> = ({ 
  value, 
  onChange, 
  onKeyDown,
  inputRef,
  onSearch
}) => {
  // Handle enter key press to trigger search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) onSearch();
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div className="relative">
      <label htmlFor="card-name" className="block mb-1 text-sm font-medium text-gray-700">
        Card Name <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id="card-name"
          type="text"
          ref={inputRef}
          placeholder="Start typing to search..."
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 pl-4 pr-12 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="button"
          onClick={onSearch}
          className="absolute inset-y-0 right-0 flex items-center px-3 bg-blue-50 hover:bg-blue-100 rounded-r-lg transition-colors border-l"
        >
          <Search className="h-5 w-5 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default SearchNameInput;
