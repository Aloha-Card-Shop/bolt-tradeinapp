import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';

export const useCardSuggestions = () => {
  const [suggestions, setSuggestions] = useState<CardDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = async (searchTerm: string, game: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('name, set_name, card_number, game')
        .eq('game', game)
        .ilike('name', `%${searchTerm}%`)
        .limit(10)
        .order('name');

      if (error) throw error;

      setSuggestions(data.map(card => ({
        name: card.name,
        set: card.set_name || '',
        number: card.card_number || '',
        game: card.game
      })));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    suggestions,
    isLoading,
    fetchSuggestions
  };
};