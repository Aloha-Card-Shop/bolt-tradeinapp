
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CardDetails, CardNumberObject } from '../types/card';
import { SetOption } from './useSetOptions';
import { createSearchFilters, formatCardNumberForSearch } from '../utils/cardSearchUtils';

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for cards based on provided criteria
  const searchCards = async (
    cardDetails: CardDetails,
    setOptions: SetOption[]
  ): Promise<Set<number>> => {
    if (!cardDetails.name && !cardDetails.number) {
      setSearchResults([]);
      return new Set<number>();
    }

    setIsSearching(true);
    try {
      let query = supabase
        .from('unified_products')
        .select('*')
        .eq('category_id', cardDetails.categoryId as number);

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
        // Format card number for search if provided
        const formattedNumber = cardDetails.number ? 
          formatCardNumberForSearch(cardDetails.number) : undefined;
        
        // Create filters for the query
        const filters = createSearchFilters(searchTerms, formattedNumber);
        
        // Combine all filters
        const finalFilter = filters.length > 1 ? `and(${filters.join(',')})` : filters[0];
        query = query.or(finalFilter);
      }

      const { data, error } = await query
        .order('name')
        .limit(20);

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
      const foundCards = (data || []).map(product => {
        // Extract card number carefully to avoid returning objects
        let cardNumber = '';
        if (product.attributes) {
          const rawCardNumber = product.attributes.card_number || product.attributes.Number || '';
          
          // Handle case when card number is an object with displayName or value
          if (typeof rawCardNumber === 'object' && rawCardNumber !== null) {
            // Type assertion to tell TypeScript that rawCardNumber is a CardNumberObject
            const numberObj = rawCardNumber as CardNumberObject;
            cardNumber = numberObj.displayName || numberObj.value || '';
          } else {
            cardNumber = String(rawCardNumber);
          }
        }
        
        return {
          name: product.name,
          set: product.group_id ? setOptions.find(s => s.id === product.group_id)?.name || '' : '',
          number: cardNumber,
          game: cardDetails.game,
          categoryId: cardDetails.categoryId,
          imageUrl: product.image_url || null,
          productId: product.tcgplayer_product_id || product.product_id?.toString() || null
        };
      });

      setSearchResults(foundCards);

      // Return the set IDs of found cards
      const foundSetIds = new Set<number>();
      (data || []).forEach(product => {
        if (product.group_id) {
          foundSetIds.add(product.group_id);
        }
      });

      return foundSetIds;
    } catch (error) {
      console.error('Error searching cards:', error);
      setSearchResults([]);
      return new Set<number>();
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchResults,
    isSearching,
    searchCards
  };
};
