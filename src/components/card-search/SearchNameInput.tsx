
import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  isSearching?: boolean;
}

const SearchNameInput: React.FC<SearchNameInputProps> = ({ 
  value, 
  onChange, 
  onKeyDown,
  inputRef,
  isSearching = false
}) => {
  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          className="w-full px-4 py-2 pl-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 pointer-events-none"
          aria-hidden="true"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Results appear as you type
      </p>
    </div>
  );
};

export default SearchNameInput;
