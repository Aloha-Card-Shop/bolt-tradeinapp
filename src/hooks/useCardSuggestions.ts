
import { useState } from 'react';
import { CardDetails, GameType } from '../types/card';
import { supabase } from '../lib/supabase';

// Maximum number of suggestions to show
const MAX_SUGGESTIONS = 7;

export const useCardSuggestions = () => {
  const [suggestions, setSuggestions] = useState<CardDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store recent searches in memory during the session
  const [recentSearches, setRecentSearches] = useState<Set<string>>(new Set());

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
        .select('name, group_id, attributes, image_url')
        .eq('category_id', categoryId)
        .ilike('name', `${query}%`) // Starts with the query
        .limit(MAX_SUGGESTIONS);

      if (exactError) throw exactError;

      // If we don't have enough exact matches, look for partial matches
      let allMatches = exactMatches || [];
      
      if (allMatches.length < MAX_SUGGESTIONS) {
        const { data: partialMatches, error: partialError } = await supabase
          .from('unified_products')
          .select('name, group_id, attributes, image_url')
          .eq('category_id', categoryId)
          .ilike('name', `%${query}%`) // Contains the query
          .not('name', 'ilike', `${query}%`) // Exclude the exactMatches we already have
          .limit(MAX_SUGGESTIONS - allMatches.length);

        if (partialError) throw partialError;
        
        if (partialMatches) {
          allMatches = [...allMatches, ...partialMatches];
        }
      }

      // Transform to CardDetails format
      const suggestions = allMatches.map(product => ({
        name: product.name,
        game,
        categoryId,
        imageUrl: product.image_url || null,
        productId: product.attributes?.tcgplayer_product_id || product.attributes?.product_id?.toString() || null,
        set: '',
        number: product.attributes?.card_number || product.attributes?.Number || ''
      }));

      setSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a search term to recent searches
  const addToRecentSearches = (term: string) => {
    setRecentSearches(prev => {
      const updated = new Set(prev);
      updated.add(term);
      return updated;
    });
  };

  // Get recent searches as an array
  const getRecentSearches = (): string[] => {
    return Array.from(recentSearches);
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches(new Set());
  };

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    addToRecentSearches,
    getRecentSearches,
    clearRecentSearches
  };
};
