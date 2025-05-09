
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
        setFilteredSetOptions(options);
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

  // Filter set options based on search results and search terms
  const filterSetOptions = (
    searchTerms: string[],
    foundSetIds?: Set<number>
  ) => {
    // Without search terms, no filtering
    if (searchTerms.length === 0 && !foundSetIds) {
      setFilteredSetOptions(setOptions);
      return;
    }

    // Filter sets based on search terms OR if they contain any of the found cards
    let filtered = setOptions;
    
    // Only filter by search terms if the user is specifically searching for a set name
    if (searchTerms.length > 0) {
      filtered = setOptions.filter(option => {
        const setName = option.name.toLowerCase();
        // Match if any search term appears anywhere in the set name
        // OR if this set contains any of our found cards
        return searchTerms.every(term => setName.includes(term.toLowerCase())) ||
               (foundSetIds && foundSetIds.has(option.id));
      });
    }

    // If we're filtering by card number, ensure sets containing matching cards are included
    if (foundSetIds && foundSetIds.size > 0) {
      // Add any sets that contain our found cards but might have been filtered out
      const additionalSets = Array.from(foundSetIds)
        .map(id => setOptions.find(s => s.id === id))
        .filter(Boolean) as SetOption[];
      
      // Combine and deduplicate sets
      filtered = Array.from(new Set([...filtered, ...additionalSets]));
    }

    // If we still have no options but have found cards, use their sets
    if (filtered.length === 0 && foundSetIds && foundSetIds.size > 0) {
      filtered = setOptions.filter(option => foundSetIds.has(option.id));
    }

    // Always sort alphabetically
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    setFilteredSetOptions(filtered);
  };

  return {
    setOptions,
    filteredSetOptions,
    isLoadingSets,
    filterSetOptions
  };
};
