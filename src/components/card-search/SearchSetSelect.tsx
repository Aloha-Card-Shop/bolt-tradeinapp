
import React from 'react';
import { SetOption } from '../../hooks/useSetOptions';

interface SearchSetSelectProps {
  selectedSet: string;
  setOptions: SetOption[];
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isFiltered?: boolean;
  onShowAllSets?: () => void;
}

const SearchSetSelect: React.FC<SearchSetSelectProps> = ({ 
  selectedSet, 
  setOptions, 
  isLoading,
  onChange,
  isFiltered = false,
  onShowAllSets
}) => {
  return (
    <div>
      <label htmlFor="set-select" className="block mb-1 text-sm font-medium text-gray-700">
        Set Name
      </label>
      {isLoading ? (
        <div className="py-2 text-sm text-gray-500">Loading sets...</div>
      ) : (
        <div className="relative">
          <select 
            id="set-select"
            name="set"
            value={selectedSet || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-70"
          >
            <option value="">Select a set</option>
            {setOptions.map((set) => (
              <option key={set.id} value={set.name}>
                {set.name}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs flex justify-between items-center">
            <span className="text-gray-500">
              {isFiltered 
                ? `${setOptions.length} matching sets` 
                : `${setOptions.length} sets available`}
            </span>
            {isFiltered && onShowAllSets && (
              <button 
                onClick={onShowAllSets}
                type="button"
                className="text-blue-500 hover:text-blue-700 text-xs"
              >
                Show all sets
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSetSelect;
