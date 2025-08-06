
import { useState, useEffect } from 'react';
import { CardDetails, GameType } from '../types/card';
import { supabase } from '../integrations/supabase/client';
import { addToSearchHistory, getSearchHistory } from '../utils/cardSearchUtils';

// Local storage key for search history
const SEARCH_HISTORY_KEY = 'card_search_history';

// Maximum number of suggestions to show
const MAX_SUGGESTIONS = 7;

// Maximum number of history items to store
const MAX_HISTORY_ITEMS = 10;

export const useCardSuggestions = () => {
  const [suggestions, setSuggestions] = useState<CardDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store recent searches using both state and localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = getSearchHistory(SEARCH_HISTORY_KEY);
    if (savedHistory.length > 0) {
      setRecentSearches(savedHistory);
    }
  }, []);

  // Fetch suggestions based on query and game
  const fetchSuggestions = async (query: string, game: GameType, categoryId: number) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check for exact matches
      const { data: exactMatches, error: exactError } = await supabase
        .from('unified_products')
        .select('name, group_id, attributes, image_url, id, product_id, tcgplayer_product_id')
        .eq('category_id', categoryId)
        .ilike('name', `${query}%`) // Starts with the query
        .limit(MAX_SUGGESTIONS);

      if (exactError) throw exactError;

      // If we don't have enough exact matches, look for partial matches
      let allMatches = exactMatches || [];
      
      if (allMatches.length < MAX_SUGGESTIONS) {
        const { data: partialMatches, error: partialError } = await supabase
          .from('unified_products')
          .select('name, group_id, attributes, image_url, id, product_id, tcgplayer_product_id')
          .eq('category_id', categoryId)
          .ilike('name', `%${query}%`) // Contains the query
          .not('name', 'ilike', `${query}%`) // Exclude the exactMatches we already have
          .limit(MAX_SUGGESTIONS - allMatches.length);

        if (partialError) throw partialError;
        
        if (partialMatches) {
          allMatches = [...allMatches, ...partialMatches];
        }
      }

      // Transform to CardDetails format with improved card number and product ID extraction
      const suggestions = allMatches.map(product => {
        // Extract card number from attributes using multiple possible paths
        let cardNumber = '';
        if (product.attributes) {
          if (product.attributes.Number) {
            cardNumber = typeof product.attributes.Number === 'object' ? 
              (product.attributes.Number.value || product.attributes.Number.displayName || '') : 
              product.attributes.Number;
          } else if (product.attributes.number) {
            cardNumber = typeof product.attributes.number === 'object' ? 
              (product.attributes.number.value || product.attributes.number.displayName || '') : 
              product.attributes.number;
          } else if (product.attributes.card_number) {
            cardNumber = typeof product.attributes.card_number === 'object' ? 
              (product.attributes.card_number.value || product.attributes.card_number.displayName || '') : 
              product.attributes.card_number;
          }
        }

        // Prioritize tcgplayer_product_id, then fall back to other ID fields
        const productId = 
          product.tcgplayer_product_id || 
          (product.attributes?.tcgplayer_product_id?.toString()) || 
          product.product_id?.toString() || 
          null;

        return {
          name: product.name,
          game,
          categoryId,
          imageUrl: product.image_url || null,
          productId,
          set: '',
          number: cardNumber
        };
      });

      setSuggestions(suggestions);
      
      // Log the suggestions for debugging
      console.log(`Found ${suggestions.length} suggestions for query: ${query}`, suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a search term to recent searches - now using both state and localStorage
  const addToRecentSearches = (term: string) => {
    if (!term || term.length < 2) return;
    
    // Update state and localStorage
    const updatedHistory = addToSearchHistory(SEARCH_HISTORY_KEY, term, MAX_HISTORY_ITEMS);
    setRecentSearches(updatedHistory);
  };

  // Get recent searches as an array
  const getRecentSearches = (): string[] => {
    return recentSearches;
  };

  // Clear all recent searches from both state and localStorage
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    addToRecentSearches,
    getRecentSearches,
    recentSearches,
    clearRecentSearches
  };
};
