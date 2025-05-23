import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';

export const useCardSearchQuery = () => {
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [lastPage, setLastPage] = useState(0);
  
  // Perform the search
  const searchCards = useCallback(async (cardDetails: CardDetails, setOptions: any[]) => {
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
      
      // Build query parameters
      const params: any = {
        game: cardDetails.game || 'pokemon'
      };
      
      if (cardDetails.categoryId) {
        params.categoryId = cardDetails.categoryId;
      }
      
      if (cardDetails.name) {
        params.name = cardDetails.name;
      }
      
      if (cardDetails.number) {
        params.number = cardDetails.number;
      }
      
      if (cardDetails.set) {
        // Find the setId from the name
        const selectedSet = setOptions.find(setOpt => 
          setOpt.label === cardDetails.set || setOpt.value === cardDetails.set
        );
        
        if (selectedSet) {
          params.setId = selectedSet.value;
        } else {
          // If no exact match, try to search by set name
          params.setName = cardDetails.set;
        }
      }
      
      console.log('Searching cards with params:', params);
      
      // Call the API
      const { data, error } = await supabase.functions.invoke('card-search', {
        body: params
      });
      
      if (error) {
        console.error('Search error:', error);
        toast.error('Error searching cards');
        setIsSearching(false);
        return foundSetIds;
      }
      
      console.log('Search results:', data);
      
      // Process results
      if (data && Array.isArray(data.cards)) {
        setSearchResults(data.cards);
        setTotalResults(data.total || data.cards.length);
        setHasMoreResults(data.hasMore || false);
        setLastPage(1);
        
        // Extract set IDs from results for set filtering
        data.cards.forEach((card: CardDetails) => {
          if (card.setId) {
            foundSetIds.push(card.setId);
          }
        });
      } else {
        setSearchResults([]);
        setHasMoreResults(false);
        setTotalResults(0);
        toast.error('No results found');
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
      // ... in a real app, you would call the API with the next page parameter
      
      setLastPage(nextPage);
      
      // For now, just set hasMore to false since we're not implementing pagination
      setHasMoreResults(false);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [hasMoreResults, isSearching, lastPage]);
  
  return {
    searchResults,
    setSearchResults, // Expose the setter to add manual results like certificates
    isSearching,
    searchCards,
    hasMoreResults,
    loadMoreResults,
    totalResults
  };
};
