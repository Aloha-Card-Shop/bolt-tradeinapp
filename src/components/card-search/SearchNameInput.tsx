
import React from 'react';
import { Search } from 'lucide-react';

interface SearchNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SearchNameInput: React.FC<SearchNameInputProps> = ({ 
  value, 
  onChange, 
  onKeyDown,
  inputRef 
}) => {
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
          onKeyDown={onKeyDown}
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default SearchNameInput;
