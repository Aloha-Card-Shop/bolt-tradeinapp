
import { useState, useEffect } from 'react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';
import { supabase } from '../lib/supabase';

interface SetOption {
  id: number;
  name: string;
}

export const useCardSearch = () => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    name: '',
    set: '',
    number: '',
    game: 'pokemon' as GameType,
    categoryId: GAME_OPTIONS[0].categoryId
  });
  
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [setOptions, setSetOptions] = useState<SetOption[]>([]);
  const [filteredSetOptions, setFilteredSetOptions] = useState<SetOption[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all sets for the selected game
  useEffect(() => {
    const fetchSetOptions = async () => {
      setIsLoadingSets(true);
      try {
        const gameOption = GAME_OPTIONS.find(option => option.value === cardDetails.game);
        if (!gameOption) {
          console.error(`Invalid game type: ${cardDetails.game}`);
          setSetOptions([]);
          return;
        }

        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('groupid, name')
          .eq('categoryid', gameOption.categoryId)
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
  }, [cardDetails.game]);

  // Format card number for better search matching
  const formatCardNumberForSearch = (cardNumber: string): string => {
    // Clean the card number to remove spaces and convert to lowercase
    const cleanNumber = cardNumber.trim().toLowerCase();
    
    // Log the card number before and after formatting for debugging
    console.log('Original card number:', cardNumber, 'Formatted:', cleanNumber);
    
    return cleanNumber;
  };

  // Search for cards and filter sets
  useEffect(() => {
    const searchCards = async () => {
      if (!cardDetails.name && !cardDetails.number) {
        setSearchResults([]);
        setFilteredSetOptions(setOptions);
        return;
      }

      setIsSearching(true);
      try {
        let query = supabase
          .from('unified_products')
          .select('*')
          .eq('category_id', cardDetails.categoryId);

        // Add set filter if specified
        if (cardDetails.set) {
          const setOption = setOptions.find(s => s.name === cardDetails.set);
          if (setOption) {
            query = query.eq('group_id', setOption.id);
          }
        }

        // Split search terms and create individual filters
        const searchTerms = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
        
        if (searchTerms.length > 0 || cardDetails.number) {
          let filters = [];
          
          // Add name filters
          if (searchTerms.length > 0) {
            const nameFilters = searchTerms.map(term => 
              `name.ilike.%${term}%`
            );
            // Combine name filters with AND logic
            filters.push(`and(${nameFilters.join(',')})`);
          }
          
          // Add enhanced card number filter if present
          if (cardDetails.number) {
            const formattedNumber = formatCardNumberForSearch(cardDetails.number);
            
            // Create a more comprehensive card number search
            // This searches both card_number and Number fields in attributes
            // It also handles partial matches better
            let cardNumberFilters = [];
            
            // Search in attributes->>'card_number'
            cardNumberFilters.push(`attributes->>'card_number'.ilike.%${formattedNumber}%`);
            
            // Also search in attributes->>'Number' (some records use this field)
            cardNumberFilters.push(`attributes->>'Number'.ilike.%${formattedNumber}%`);
            
            // Search in clean_name which may contain the number
            cardNumberFilters.push(`clean_name.ilike.%${formattedNumber}%`);
            
            // Handle cases where number might be a prefix
            // This helps find cards like "12/107" when searching for "12"
            cardNumberFilters.push(`attributes->>'card_number'.ilike.${formattedNumber}/%`);
            cardNumberFilters.push(`attributes->>'Number'.ilike.${formattedNumber}/%`);
            
            // Combine all card number filters with OR logic
            filters.push(`or(${cardNumberFilters.join(',')})`);
            
            // Log the card number search filters for debugging
            console.log('Card number search filters:', cardNumberFilters);
          }
          
          // Combine all filters
          const finalFilter = filters.length > 1 ? `and(${filters.join(',')})` : filters[0];
          query = query.or(finalFilter);
        }

        const { data, error } = await query
          .order('name')
          .limit(20); // Increased limit to help find more matches

        if (error) throw error;

        // Log the number of results found
        console.log(`Found ${data?.length || 0} results for card search`, { 
          name: cardDetails.name, 
          number: cardDetails.number,
          set: cardDetails.set
        });

        if (data && data.length > 0) {
          // Log the first few results to help understand what's being found
          console.log('Sample search results:', data.slice(0, 3).map(item => ({
            name: item.name,
            card_number: item.attributes?.card_number || item.attributes?.Number,
            set_id: item.group_id
          })));
        }

        // Important: First convert the search results to CardDetails objects
        const foundCards = (data || []).map(product => ({
          name: product.name,
          set: product.group_id ? setOptions.find(s => s.id === product.group_id)?.name || '' : '',
          number: product.attributes?.card_number || product.attributes?.Number || '',
          game: cardDetails.game,
          categoryId: cardDetails.categoryId,
          imageUrl: product.image_url || null,
          productId: product.tcgplayer_product_id || product.product_id?.toString() || null
        }));

        setSearchResults(foundCards);

        // Include sets from search results in our filtered sets
        const foundSetIds = new Set<number>();
        (data || []).forEach(product => {
          if (product.group_id) {
            foundSetIds.add(product.group_id);
          }
        });

        // Filter sets based on search terms OR if they contain any of the found cards
        const searchTermsForSets = cardDetails.name.toLowerCase().split(' ').filter(Boolean);
        let filteredOptions = setOptions;
        
        // Only filter by search terms if the user is specifically searching for a set name
        if (searchTermsForSets.length > 0) {
          filteredOptions = setOptions.filter(option => {
            const setName = option.name.toLowerCase();
            // Match if any search term appears anywhere in the set name
            // OR if this set contains any of our found cards
            return searchTermsForSets.every(term => setName.includes(term.toLowerCase())) ||
                   foundSetIds.has(option.id);
          });
        }

        // If we're filtering by card number, ensure sets containing matching cards are included
        if (cardDetails.number && filteredOptions.length > 0) {
          // Add any sets that contain our found cards but might have been filtered out
          const additionalSets = Array.from(foundSetIds)
            .map(id => setOptions.find(s => s.id === id))
            .filter(Boolean) as SetOption[];
          
          // Combine and deduplicate sets
          filteredOptions = Array.from(new Set([...filteredOptions, ...additionalSets]));
        }

        // If we still have no options but have found cards, use their sets
        if (filteredOptions.length === 0 && foundSetIds.size > 0) {
          filteredOptions = setOptions.filter(option => foundSetIds.has(option.id));
        }

        // Always sort filtered options alphabetically
        filteredOptions = [...filteredOptions].sort((a, b) => a.name.localeCompare(b.name));

        setFilteredSetOptions(filteredOptions.length > 0 ? filteredOptions : setOptions);
      } catch (error) {
        console.error('Error searching cards:', error);
        setSearchResults([]);
        setFilteredSetOptions(setOptions);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search to avoid too many requests
    const timer = setTimeout(searchCards, 300);
    return () => clearTimeout(timer);
  }, [cardDetails.name, cardDetails.game, cardDetails.set, cardDetails.number, cardDetails.categoryId, setOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'game') {
      const gameOption = GAME_OPTIONS.find(option => option.value === value as GameType);
      setCardDetails(prev => ({
        ...prev,
        game: value as GameType,
        categoryId: gameOption?.categoryId,
        set: ''
      }));
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
      
      // Reset set selection if name is cleared
      if (name === 'name' && !value) {
        setCardDetails(prev => ({ ...prev, set: '' }));
        setFilteredSetOptions(setOptions);
      }
    }
  };

  const resetSearch = () => {
    setCardDetails({
      name: '',
      set: '',
      number: '',
      game: cardDetails.game,
      categoryId: cardDetails.categoryId
    });
    setSearchResults([]);
  };

  return {
    cardDetails,
    searchResults,
    setOptions: filteredSetOptions,
    isLoadingSets,
    isSearching,
    handleInputChange,
    resetSearch
  };
};
