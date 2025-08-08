
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../integrations/supabase/client';
import { CardDetails } from '../types/card';
import { extractNumberBeforeSlash } from '../utils/cardSearchUtils';

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [lastPage, setLastPage] = useState(0);
  
  // Perform the search
  const searchCards = useCallback(async (cardDetails: CardDetails, _setOptions: any[]) => {
    setIsSearching(true);
    const foundSetIds: string[] = [];
    
    try {
      // If no search criteria provided, just return empty results
      if (!cardDetails.name && !cardDetails.number && !cardDetails.set) {
        setSearchResults([]);
        setIsSearching(false);
        setHasMoreResults(false);
        setTotalResults(0);
        return foundSetIds;
      }

      // Build a realtime JustTCG search using our edge proxy
      const mapGameToJustTcg = (g?: string) => {
        if (!g) return undefined;
        // Map our internal game keys to JustTCG "game" ids
        if (g === 'pokemon' || g === 'japanese-pokemon') return 'pokemon';
        return g; // fallthrough for future games if added
      };

      // Build query: when both name and number are present, query by name only (then filter by number client-side)
      const numberStr = typeof cardDetails.number === 'string'
        ? cardDetails.number.trim()
        : (cardDetails.number?.value || cardDetails.number?.formatted || cardDetails.number?.raw || '').toString().trim();
      const nameStr = (cardDetails.name || '').trim();
      const q = nameStr || numberStr; // prefer name; if none, use number only

      const { data, error } = await supabase.functions.invoke('justtcg-cards', {
        body: {
          q,
          game: mapGameToJustTcg(cardDetails.game),
          limit: 12,
          offset: 0,
        }
      });

      if (error) {
        const status = (error as any)?.context?.response?.status || (error as any)?.status;
        console.error('JustTCG search error:', error);
        if (status === 401) {
          toast.error('JustTCG rejected the API key. Check Admin → API Settings.');
        } else {
          toast.error('Error searching cards');
        }
        setIsSearching(false);
        return foundSetIds;
      }

      const cards = Array.isArray(data?.data) ? data.data : [];

      // If a number was provided, filter results client-side by matching the number before the slash
      let filteredCards: any[] = cards;
      if (numberStr) {
        const norm = (s: string) => (extractNumberBeforeSlash(s) || '').replace(/^0+/, '');
        const target = norm(numberStr);
        filteredCards = cards.filter((c: any) => {
          const num = String(c?.number || '');
          return norm(num) === target || num.includes(numberStr);
        });
      }

      if (filteredCards.length === 0) {
        setSearchResults([]);
        setHasMoreResults(false);
        setTotalResults(0);
        toast.error('No results found');
      } else {
        const formattedResults: CardDetails[] = filteredCards.map((c: any) => ({
          id: c.id || `jt-${Math.random().toString(36).slice(2, 10)}`,
          name: c.name || '',
          set: c.set || undefined,
          number: c.number || undefined,
          game: cardDetails.game || 'pokemon',
          imageUrl: null,
          productId: c.tcgplayerId || null,
          rarity: c.rarity || undefined,
        }));

        setSearchResults(formattedResults);
        setTotalResults(data?.meta?.total ?? formattedResults.length);
        setHasMoreResults(Boolean(data?.meta?.hasMore));
        setLastPage(1);
      }
    } catch (err) {
      console.error('Card search error:', err);
      toast.error('Error searching cards');
    } finally {
      setIsSearching(false);
    }
    
    return foundSetIds;
  }, []);
  
  // Load more results
  const loadMoreResults = useCallback(async () => {
    if (!hasMoreResults || isSearching) return;
    
    setIsSearching(true);
    const nextPage = lastPage + 1;
    
    try {
      // Implementation for pagination would go here
      // For now, just set hasMore to false since we're not implementing pagination yet
      setLastPage(nextPage);
      setHasMoreResults(false);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [hasMoreResults, isSearching, lastPage]);

  // Add certificate card to search results - this is the key function
  const addCertificateToResults = useCallback((certificateCard: CardDetails) => {
    console.log('Adding certificate card to search results:', certificateCard);
    
    // Ensure the certificate card has all required fields for display
    const formattedCertificateCard = {
      ...certificateCard,
      id: certificateCard.id || certificateCard.certification?.certNumber || `cert-${Date.now()}`,
      productId: certificateCard.productId || certificateCard.certification?.certNumber,
      isCertified: true,
      // Ensure we have a valid game type
      game: certificateCard.game || 'pokemon'
    };
    
    console.log('Formatted certificate card:', formattedCertificateCard);
    
    setSearchResults(prevResults => {
      console.log('Current search results before adding certificate:', prevResults);
      
      // Check if this certificate is already in the results
      const existingIndex = prevResults.findIndex(
        card => card.isCertified && 
               card.certification?.certNumber === formattedCertificateCard.certification?.certNumber
      );
      
      if (existingIndex >= 0) {
        // Replace the existing entry if it exists
        const newResults = [...prevResults];
        newResults[existingIndex] = formattedCertificateCard;
        console.log('Updated existing certificate in results');
        return newResults;
      }
      
      // Otherwise add to the beginning
      console.log('Added new certificate to beginning of results');
      const newResults = [formattedCertificateCard, ...prevResults];
      console.log('New search results after adding certificate:', newResults);
      toast.success(`Found certificate: ${formattedCertificateCard.name} (PSA ${formattedCertificateCard.certification?.grade || '?'})`);
      return newResults;
    });
    
    // Update total results count
    setTotalResults(prev => {
      const newTotal = prev + 1;
      console.log('Updated total results:', newTotal);
      return newTotal;
    });
  }, []);
  
  return {
    searchResults,
    setSearchResults, // Keep this for manual result management
    isSearching,
    searchCards,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    addCertificateToResults // Make sure this is exposed
  };
};
