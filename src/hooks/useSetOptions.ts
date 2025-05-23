
import { useState } from 'react';

export interface SetOption {
  id: number;
  name: string;
  gameId?: number; 
  count?: number;
}

export const useSetOptions = () => {
  const [setOptions, setSetOptions] = useState<SetOption[]>([]);
  const [filteredSetOptions, setFilteredSetOptions] = useState<SetOption[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  // This function now accepts a Set<number> of set IDs for filtering
  const filterSetOptions = (
    searchTerms: string[],
    foundSetIds: Set<number> = new Set<number>()
  ) => {
    if (!searchTerms.length && foundSetIds.size === 0) {
      // No search terms or set IDs provided, show all sets
      setFilteredSetOptions(setOptions);
      setIsFiltered(false);
      return;
    }

    if (foundSetIds.size > 0) {
      // Filter by found set IDs from search results
      const filtered = setOptions.filter(set => foundSetIds.has(set.id));
      setFilteredSetOptions(filtered);
      setIsFiltered(filtered.length < setOptions.length);
      return;
    }

    // Filter by search terms
    const filtered = setOptions.filter(set => {
      const name = set.name.toLowerCase();
      return searchTerms.every(term => name.includes(term.toLowerCase()));
    });
    
    setFilteredSetOptions(filtered);
    setIsFiltered(filtered.length < setOptions.length);
  };

  const showAllSets = () => {
    setFilteredSetOptions(setOptions);
    setIsFiltered(false);
  };

  // Add function to update set options
  const updateSetOptions = (options: SetOption[], isLoading: boolean = false) => {
    setSetOptions(options);
    setFilteredSetOptions(options);
    setIsLoadingSets(isLoading);
  };

  return {
    setOptions,
    filteredSetOptions,
    isLoadingSets,
    isFiltered,
    filterSetOptions,
    showAllSets,
    updateSetOptions
  };
};
