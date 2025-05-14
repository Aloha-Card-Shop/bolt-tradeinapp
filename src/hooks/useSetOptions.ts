
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
  const [isFiltered, setIsFiltered] = useState(false);

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
        setIsFiltered(false); // Reset filter status
        
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

  // Modified filter function that only shows sets containing search results
  const filterSetOptions = (
    searchTerms: string[],
    foundSetIds?: Set<number>
  ) => {
    console.log(`Filtering sets with terms: [${searchTerms.join(', ')}], foundSetIds size: ${foundSetIds?.size || 0}`);
    
    // If search is empty, show all sets
    if (searchTerms.length === 0) {
      console.log(`Showing all ${setOptions.length} sets - no search terms active`);
      setFilteredSetOptions([...setOptions].sort((a, b) => a.name.localeCompare(b.name)));
      setIsFiltered(false);
      return;
    }

    // If we have search results with specific sets, ONLY show those sets
    if (foundSetIds && foundSetIds.size > 0) {
      // Only include sets that contain our found cards
      const filtered = setOptions.filter(set => foundSetIds.has(set.id))
        .sort((a, b) => a.name.localeCompare(b.name)); // Still sort alphabetically
      
      console.log(`Filtered to ${filtered.length} sets containing search results`);
      setFilteredSetOptions(filtered);
      setIsFiltered(true);
    } else {
      // If we have search terms but no matching sets found yet, 
      // still show all sets until we get actual results
      setFilteredSetOptions([...setOptions].sort((a, b) => a.name.localeCompare(b.name)));
      setIsFiltered(false);
      console.log(`No matching sets found yet, showing all ${setOptions.length} sets`);
    }
  };

  const showAllSets = () => {
    setFilteredSetOptions([...setOptions].sort((a, b) => a.name.localeCompare(b.name)));
    setIsFiltered(false);
    console.log(`Reset filter to show all ${setOptions.length} sets`);
  };

  return {
    setOptions,
    filteredSetOptions,
    isLoadingSets,
    filterSetOptions,
    showAllSets,
    isFiltered
  };
};
