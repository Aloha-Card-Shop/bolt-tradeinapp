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

  // Modified filter function that is less aggressive with filtering
  const filterSetOptions = (
    searchTerms: string[],
    foundSetIds?: Set<number>
  ) => {
    console.log(`Filtering sets with terms: [${searchTerms.join(', ')}], foundSetIds size: ${foundSetIds?.size || 0}`);
    
    // If search is empty or hasn't produced results yet, show all sets
    if (searchTerms.length === 0) {
      console.log(`Showing all ${setOptions.length} sets - no search terms active`);
      setFilteredSetOptions([...setOptions].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }

    // If we have foundSetIds from search results, prioritize showing those sets
    // but don't exclude sets based on name matching
    let filtered = [...setOptions]; // Start with all sets
    
    // If we have search results with specific sets, prioritize those
    if (foundSetIds && foundSetIds.size > 0) {
      // Mark sets that contain our found cards
      const matchingSets = new Set(Array.from(foundSetIds));
      
      // Sort so that matching sets appear first
      filtered = filtered.sort((a, b) => {
        // If a is a matching set and b is not, a comes first
        if (matchingSets.has(a.id) && !matchingSets.has(b.id)) return -1;
        // If b is a matching set and a is not, b comes first
        if (!matchingSets.has(a.id) && matchingSets.has(b.id)) return 1;
        // Otherwise sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Prioritized ${foundSetIds.size} sets with matching cards`);
    } else {
      // Without search results, just sort alphabetically
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

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
