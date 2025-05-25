import { CardDetails } from '../types/card';
import { createCardNumberFilters } from './cardSearchUtils';

// Constants
export const DEBUG_MODE = true;
export const RESULTS_PER_PAGE = 12;

// This function builds the GraphQL query for card search
export const buildSearchQuery = (
  cardDetails: CardDetails,
  page = 0,
  limit = RESULTS_PER_PAGE
): { query: any; variables: any } => {
  // Basic variables
  const variables: any = {
    limit,
    offset: page * limit,
    sort: "most_relevant"
  };

  // Build filter array
  const filters: string[] = [];

  // Game type filtering - only include if game is provided
  if (cardDetails.game) {
    if (cardDetails.game === 'pokemon') {
      filters.push("game.eq.pokemon");
    } else if (cardDetails.game === 'magic') {
      filters.push("game.eq.mtg");
    } else if (cardDetails.game === 'yugioh') {
      filters.push("game.eq.yugioh");
    } else if (cardDetails.game === 'sports') {
      filters.push("game.eq.sports");
    } else if (cardDetails.game === 'other') {
      filters.push("game.neq.mtg");
      filters.push("game.neq.pokemon");
      filters.push("game.neq.yugioh");
      filters.push("game.neq.sports");
    }
  }

  // Name search - enhance name match with product_name
  if (cardDetails.name && cardDetails.name.trim().length > 0) {
    // Split the name into terms for better matching
    const nameTerms = cardDetails.name.trim().toLowerCase().split(/\s+/);
    
    if (nameTerms.length === 1) {
      // For single-term searches, allow for more flexibility
      filters.push(`(product_name.ilike.%${nameTerms[0]}%,attributes->>'Name'.ilike.%${nameTerms[0]}%)`);
    } else {
      // For multi-term searches, require all terms to match
      nameTerms.forEach(term => {
        filters.push(`(product_name.ilike.%${term}%,attributes->>'Name'.ilike.%${term}%)`);
      });
    }
    
    variables.name = cardDetails.name.trim();
  }

  // Set filtering
  if (cardDetails.set && cardDetails.set.trim().length > 0) {
    filters.push(`attributes->>'Set Name'.ilike.%${cardDetails.set.trim()}%`);
    variables.set = cardDetails.set.trim();
  }

  // Card number filtering with enhanced matching
  if (cardDetails.number) {
    const cardNumberStr = typeof cardDetails.number === 'string' 
      ? cardDetails.number.trim() 
      : cardDetails.number.value || cardDetails.number.formatted || cardDetails.number.raw || '';
      
    if (cardNumberStr.length > 0) {
      // Use the utility function to create robust card number filters
      const cardNumberFilters = createCardNumberFilters(cardNumberStr);
      if (cardNumberFilters.length > 0) {
        filters.push(`(${cardNumberFilters.join(',')})`);
        variables.cardNumber = cardNumberStr;
      }
    }
  }

  // If no filters provided, limit results to prevent too broad a search
  if (filters.length === 0) {
    variables.limit = 20;
  }

  // Combine all filters with AND logic
  variables.filter = filters.join(',');

  // For debug logging
  if (DEBUG_MODE) {
    console.log("Search variables:", variables);
  }

  // Return the query and variables
  return {
    query: `
      query Search($filter: String!, $sort: String!, $limit: Int!, $offset: Int!) {
        search(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
          total
          results {
            id
            product_id
            product_name
            group_name
            group_id
            image_url
            rarity
            card_number
            attributes
            release_date
            game
          }
        }
      }
    `,
    variables
  };
};

export const formatResultsToCardDetails = (
  results: any[],
  setOptions: any[] = [],
  searchCriteria?: CardDetails
): CardDetails[] => {
  if (DEBUG_MODE) {
    console.log("Formatting results:", results);
  }

  if (!results || results.length === 0) {
    return [];
  }
  
  return results.map(item => {
    // Set name lookup for unified_products table
    const setName = (item.group_id && setOptions.length > 0 && 
      setOptions.find((s:any) => s.id === item.group_id)?.name) || '';
    
    // Use the direct card_number column instead of extracting from attributes
    let cardNumber = item.card_number || '';
    
    // Fall back to attributes if card_number is not available
    if (!cardNumber && item.attributes) {
      const attributes = typeof item.attributes === 'string'
        ? JSON.parse(item.attributes)
        : item.attributes;
      
      cardNumber = attributes?.Number || attributes?.card_number || '';
    }

    // Extract the game type from item and convert to our GameType enum
    let gameType = item.game || searchCriteria?.game || 'other';
    
    // Map from database game types to our GameType enum
    if (gameType === 'mtg') gameType = 'magic';
    if (gameType === 'pkmn' || gameType === 'pokemon-card') gameType = 'pokemon';
    
    // Format the card details
    const cardDetails: CardDetails = {
      id: item.id || `result-${Math.random().toString(36).substring(2, 11)}`,
      name: item.product_name || '',
      set: setName || item.group_name || '',
      setId: item.group_id?.toString() || undefined,
      number: cardNumber,
      game: gameType,
      imageUrl: item.image_url || null,
      rarity: item.rarity || undefined,
      releaseYear: item.release_date?.substring(0, 4) || undefined,
      productId: item.product_id?.toString() || null
    };

    return cardDetails;
  });
};

export const getCategoryIdForGame = (gameType: string): number => {
  switch (gameType) {
    case 'magic':
      return 1;
    case 'pokemon':
      return 2;
    case 'yugioh':
      return 3;
    case 'sports':
      return 4;
    case 'other':
    default:
      return 8; // Default category for other games
  }
};
