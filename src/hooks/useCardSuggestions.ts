
import { useState } from 'react';
import { CardDetails } from '../types/card';
import { supabase } from '../lib/supabase';

export const useCardSuggestions = () => {
  const [suggestions, setSuggestions] = useState<CardDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (query: string, game: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('game', game)
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions
  };
};
