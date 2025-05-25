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
      
      // Build the query for unified_products table
      let query = supabase
        .from('unified_products')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .limit(12);
      
      // Filter by category based on game type - using correct category IDs
      if (cardDetails.game === 'pokemon') {
        query = query.eq('category_id', 3); // Correct Pokemon category ID
      } else if (cardDetails.game === 'japanese-pokemon') {
        query = query.eq('category_id', 85); // Correct Japanese Pokemon category ID
      }
      
      // Add name search filter
      if (cardDetails.name && cardDetails.name.trim()) {
        const searchName = cardDetails.name.trim();
        query = query.ilike('name', `%${searchName}%`);
      }
      
      // Add card number search filter
      if (cardDetails.number) {
        const searchNumber = typeof cardDetails.number === 'string' 
          ? cardDetails.number.trim() 
          : cardDetails.number.value || cardDetails.number.formatted || cardDetails.number.raw || '';
          
        if (searchNumber) {
          // Search in both card_number column and attributes->Number field
          query = query.or(`card_number.ilike.%${searchNumber}%,attributes->>'Number'.ilike.%${searchNumber}%`);
        }
      }
      
      // Add set search filter
      if (cardDetails.set && cardDetails.set.trim()) {
        // Find the group_id from setOptions if available
        const selectedSet = setOptions.find(setOpt => 
          setOpt.name === cardDetails.set || setOpt.value === cardDetails.set
        );
        
        if (selectedSet && selectedSet.id) {
          query = query.eq('group_id', selectedSet.id);
        } else {
          // Fallback to searching by name pattern in attributes
          query = query.ilike('attributes->>"Set Name"', `%${cardDetails.set.trim()}%`);
        }
      }
      
      console.log('Executing unified_products query with params:', {
        name: cardDetails.name,
        number: cardDetails.number,
        set: cardDetails.set,
        game: cardDetails.game,
        categoryId: cardDetails.game === 'pokemon' ? 3 : 85
      });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Database search error:', error);
        toast.error('Error searching cards');
        setIsSearching(false);
        return foundSetIds;
      }
      
      console.log('Database search results:', { count, resultsLength: data?.length });
      
      // Process and format results
      if (data && Array.isArray(data)) {
        const formattedResults: CardDetails[] = data.map(item => {
          // Extract card number from attributes or card_number column
          let cardNumber = item.card_number || '';
          if (!cardNumber && item.attributes) {
            const attributes = typeof item.attributes === 'string'
              ? JSON.parse(item.attributes)
              : item.attributes;
            cardNumber = attributes?.Number || attributes?.card_number || '';
          }
          
          // Find set name from setOptions using group_id
          const setName = setOptions.find(s => s.id === item.group_id)?.name || '';
          
          // Extract set IDs for filtering
          if (item.group_id) {
            foundSetIds.push(item.group_id.toString());
          }
          
          return {
            id: item.id?.toString() || `unified-${Math.random().toString(36).substring(2, 11)}`,
            name: item.name || '',
            set: setName,
            setId: item.group_id?.toString() || undefined,
            number: cardNumber,
            game: cardDetails.game || 'pokemon',
            imageUrl: item.image_url || null,
            productId: item.product_id?.toString() || item.tcgplayer_product_id || null,
            releaseYear: item.released_on?.substring(0, 4) || undefined,
            categoryId: item.category_id
          };
        });
        
        setSearchResults(formattedResults);
        setTotalResults(count || data.length);
        setHasMoreResults((count || 0) > 12);
        setLastPage(1);
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
    
    setSearchResults(prevResults => {
      // Check if this certificate is already in the results
      const existingIndex = prevResults.findIndex(
        card => card.isCertified && 
               card.certification?.certNumber === certificateCard.certification?.certNumber
      );
      
      if (existingIndex >= 0) {
        // Replace the existing entry if it exists
        const newResults = [...prevResults];
        newResults[existingIndex] = certificateCard;
        console.log('Updated existing certificate in results');
        return newResults;
      }
      
      // Otherwise add to the beginning
      console.log('Added new certificate to beginning of results');
      toast.success(`Found certificate: ${certificateCard.name} (PSA ${certificateCard.certification?.grade || '?'})`);
      return [certificateCard, ...prevResults];
    });
    
    // Update total results count
    setTotalResults(prev => prev + 1);
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
