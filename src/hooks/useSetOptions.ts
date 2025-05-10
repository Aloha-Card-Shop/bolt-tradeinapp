
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GameType } from '../types/card';

export interface SetOption {
  id: number;
  name: string;
}

export const useSetOptions = (game: GameType, categoryId?: number) => {
  const [setOptions, setSetOptions] = useState<SetOption[]>([]);
  const [filteredSetOptions, setFilteredSetOptions] = useState<SetOption[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);

  // Fetch all sets for the selected game
  useEffect(() => {
    const fetchSetOptions = async () => {
      setIsLoadingSets(true);
      try {
        if (!categoryId) {
          console.error(`Invalid category ID for game type: ${game}`);
          setSetOptions([]);
          return;
        }

        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('groupid, name')
          .eq('categoryid', categoryId)
          .order('name', { ascending: true }); // Sort alphabetically at the database level

        if (groupsError) throw groupsError;

        const options = groups?.map(group => ({
          id: group.groupid,
          name: group.name
        })) || [];

        setSetOptions(options);
        setFilteredSetOptions(options); // Initially show all sets
        
        console.log(`Loaded ${options.length} sets for game type: ${game}, categoryId: ${categoryId}`);
        
      } catch (error) {
        console.error('Error fetching set options:', error);
        setSetOptions([]);
        setFilteredSetOptions([]);
      } finally {
        setIsLoadingSets(false);
      }
    };

    fetchSetOptions();
  }, [game, categoryId]);

  // Filter set options based on search results and search terms with less aggressive filtering
  const filterSetOptions = (
    searchTerms: string[],
    foundSetIds?: Set<number>
  ) => {
    console.log(`Filtering sets with terms: [${searchTerms.join(', ')}], foundSetIds size: ${foundSetIds?.size || 0}`);
    
    // Without search terms or found sets, show all sets
    if (searchTerms.length === 0 && (!foundSetIds || foundSetIds.size === 0)) {
      console.log(`Showing all ${setOptions.length} sets - no filters active`);
      setFilteredSetOptions(setOptions);
      return;
    }

    let filtered = setOptions;
    
    // If we have search terms, do light filtering
    if (searchTerms.length > 0) {
      // Less aggressive filtering - match if ANY search term appears anywhere in the set name
      filtered = setOptions.filter(option => {
        const setName = option.name.toLowerCase();
        return searchTerms.some(term => setName.includes(term.toLowerCase()));
      });
      console.log(`After term filtering: ${filtered.length} sets match search terms`);
    }

    // Ensure we include sets that contain matching cards
    if (foundSetIds && foundSetIds.size > 0) {
      // Create a Set from the filtered sets for O(1) lookups
      const filteredSetIds = new Set(filtered.map(set => set.id));
      
      // Add any missing sets that contain our found cards
      const setsToAdd = Array.from(foundSetIds)
        .filter(id => !filteredSetIds.has(id))
        .map(id => setOptions.find(s => s.id === id))
        .filter(Boolean) as SetOption[];
      
      if (setsToAdd.length > 0) {
        console.log(`Adding ${setsToAdd.length} additional sets that contain matching cards`);
        filtered = [...filtered, ...setsToAdd];
      }
    }

    // Always sort alphabetically
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Final filtered set count: ${filtered.length} sets`);
    setFilteredSetOptions(filtered);
  };

  return {
    setOptions,
    filteredSetOptions,
    isLoadingSets,
    filterSetOptions
  };
};
