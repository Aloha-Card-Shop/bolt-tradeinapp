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

  // Fetch suggestions based on query and game (uses JustTCG edge function)
  const fetchSuggestions = async (query: string, game: GameType, categoryId: number) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mapGameToJustTcg = (g?: string) => {
        if (!g) return undefined;
        if (g === 'pokemon' || g === 'japanese-pokemon') return 'pokemon';
        return g; // fallthrough for future games if added
      };

      const { data, error } = await supabase.functions.invoke('justtcg-cards', {
        body: {
          q: query,
          game: mapGameToJustTcg(game),
          limit: MAX_SUGGESTIONS,
          offset: 0,
        }
      });

      if (error) throw error;

      const cards = Array.isArray(data?.data) ? data.data : [];

      const baseSuggestions = cards.map((c: any) => ({
        name: c.name || '',
        game,
        categoryId,
        imageUrl: c.imageUrl || c.image_url || c.image || (c.images?.small ?? (Array.isArray(c.images) ? c.images[0] : undefined)) || null,
        productId: c.tcgplayerId || null,
        set: c.set || '',
        number: c.number || ''
      }));

      // Enrich with images from unified_products when missing
      let enrichedSuggestions = baseSuggestions;
      const idsToFetch = Array.from(new Set(baseSuggestions.filter((s: any) => !s.imageUrl && s.productId).map((s: any) => String(s.productId))));
      if (idsToFetch.length > 0) {
        const { data: imageRows, error: imgErr } = await supabase
          .from('unified_products')
          .select('tcgplayer_product_id, image_url')
          .in('tcgplayer_product_id', idsToFetch as any);

        if (imgErr) {
          console.warn('Suggestion image enrichment failed:', imgErr);
        } else if (Array.isArray(imageRows)) {
          const imgMap: Record<string, string> = {};
          for (const row of imageRows) {
            if (row?.image_url) {
              imgMap[String(row.tcgplayer_product_id)] = row.image_url as string;
            }
          }
          enrichedSuggestions = baseSuggestions.map((s: any) => ({
            ...s,
            imageUrl: s.imageUrl ?? (s.productId ? imgMap[String(s.productId)] ?? null : null)
          }));
        }
      }

      setSuggestions(enrichedSuggestions);
      console.log(`Found ${enrichedSuggestions.length} suggestions (JustTCG) for query: ${query}`, enrichedSuggestions);
    } catch (err) {
      console.error('Error fetching suggestions (JustTCG):', err);
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