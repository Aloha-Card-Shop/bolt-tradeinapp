import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { GameType } from '../types/card';

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

  // Load sets from database based on game type
  const loadSetsByGame = useCallback(async (gameType: GameType) => {
    setIsLoadingSets(true);
    
    try {
      // Map game type to category ID
      const categoryId = gameType === 'pokemon' ? 3 : 85;
      
      console.log('Loading sets for game type:', gameType, 'category:', categoryId);
      
      const { data, error } = await supabase
        .from('groups')
        .select('groupid, name, categoryid')
        .eq('categoryid', categoryId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error loading sets:', error);
        return;
      }
      
      console.log('Loaded sets:', data?.length);
      
      const formattedSets: SetOption[] = data?.map(set => ({
        id: set.groupid,
        name: set.name,
        gameId: set.categoryid
      })) || [];
      
      setSetOptions(formattedSets);
      setFilteredSetOptions(formattedSets);
    } catch (err) {
      console.error('Error loading sets:', err);
    } finally {
      setIsLoadingSets(false);
    }
  }, []);

  // This function now accepts a Set<number> of set IDs for filtering
  const filterSetOptions = useCallback((
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
  }, [setOptions]);

  const showAllSets = useCallback(() => {
    setFilteredSetOptions(setOptions);
    setIsFiltered(false);
  }, [setOptions]);

  // Add function to update set options
  const updateSetOptions = useCallback((options: SetOption[], isLoading: boolean = false) => {
    setSetOptions(options);
    setFilteredSetOptions(options);
    setIsLoadingSets(isLoading);
  }, []);

  return {
    setOptions,
    filteredSetOptions,
    isLoadingSets,
    isFiltered,
    filterSetOptions,
    showAllSets,
    updateSetOptions,
    loadSetsByGame
  };
};
