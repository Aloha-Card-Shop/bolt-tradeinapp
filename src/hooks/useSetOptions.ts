import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { GameType } from '../types/card';

export interface SetOption {
  id: string;
  name: string;
  gameId?: string; 
  count?: number;
}

export const useSetOptions = () => {
  const [setOptions, setSetOptions] = useState<SetOption[]>([]);
  const [filteredSetOptions, setFilteredSetOptions] = useState<SetOption[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  // Load sets from JustTCG via Edge Function based on game type
  const loadSetsByGame = useCallback(async (gameType: GameType) => {
    setIsLoadingSets(true);
    
    try {
      const mapGameToJustTcg = (g: GameType) => {
        if (g === 'pokemon' || g === 'japanese-pokemon') return 'pokemon';
        return (g as unknown as string);
      };

      console.log('Loading sets for game type (JustTCG):', gameType);

      const { data, error } = await supabase.functions.invoke('justtcg-sets', {
        body: { game: mapGameToJustTcg(gameType) }
      });

      if (error) {
        console.error('Error loading sets (JustTCG):', error);
        setSetOptions([]);
        setFilteredSetOptions([]);
        return;
      }

      const sets = Array.isArray(data?.data) ? data.data : [];
      console.log('Loaded sets from JustTCG:', sets?.length);

      const formattedSets: SetOption[] = sets.map((set: any) => ({
        id: String(set.id),
        name: set.name,
        gameId: set.game_id || undefined,
        count: set.cards_count,
      }));

      setSetOptions(formattedSets);
      setFilteredSetOptions(formattedSets);
    } catch (err) {
      console.error('Error loading sets (JustTCG):', err);
      setSetOptions([]);
      setFilteredSetOptions([]);
    } finally {
      setIsLoadingSets(false);
    }
  }, []);

  // This function now accepts a Set<string> of set IDs for filtering
  const filterSetOptions = useCallback((
    searchTerms: string[],
    foundSetIds: Set<string> = new Set<string>()
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
