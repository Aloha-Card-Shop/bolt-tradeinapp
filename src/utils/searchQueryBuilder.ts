
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';

// Define the number of results per page
export const RESULTS_PER_PAGE = 48;

// Utility function to build the Supabase query
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number = 0
): Promise<{ query: any; foundSetIds: Set<number> }> => {
  // Destructure card details for easier use
  const { name, set, number, game, categoryId } = cardDetails;

  // Initialize set to store found set IDs
  const foundSetIds: Set<number> = new Set();

  // Calculate the range for pagination
  const from = page * RESULTS_PER_PAGE;
  const to = (page + 1) * RESULTS_PER_PAGE - 1;

  // Start building the query
  let query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to);

  // Apply filters based on provided card details
  if (game) {
    query = query.eq('game', game);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (name) {
    query = query.ilike('name', `%${name}%`);
  }
  if (set) {
    const setId = setOptions.find(s => s.name === set)?.id;
    if (setId) {
      query = query.eq('group_id', setId);
      foundSetIds.add(setId);
    }
  }
  if (number) {
    query = query.ilike('number', `%${number}%`);
  }

  return { query, foundSetIds };
};

export const formatResultsToCardDetails = (
  results: any[],
  setOptions: SetOption[],
  searchCriteria: CardDetails
): CardDetails[] => {
  return results.map(item => {
    // Set name lookup
    const setName = item.group_name || 
      (item.group_id && setOptions.find(s => s.id === item.group_id)?.name) || 
      '';
    
    // Normalize card number structure
    let cardNumber = item.number || '';
    if (typeof cardNumber === 'object') {
      cardNumber = cardNumber.value || cardNumber.displayName || '';
    }
    
    // Extract product ID with improved priority hierarchy
    const productId = extractProductId(item);
    
    // Debug output to trace productId extraction
    console.log(`Card: ${item.name}, Extracted ID: ${productId}, Raw ID sources:`, {
      direct_id: item.id,
      tcgplayer_id: item.tcgplayer_product_id,
      product_id: item.product_id,
      attrs_tcgplayer: item.attributes?.tcgplayer_product_id,
      attrs_product: item.attributes?.product_id
    });

    return {
      name: item.name || item.clean_name || '',
      set: setName,
      number: item.number || '',
      game: searchCriteria.game,
      categoryId: searchCriteria.categoryId,
      productId: productId,
      imageUrl: item.image_url || item.imageUrl || null,
      id: item.id?.toString() || null
    };
  });
};

// Helper function to extract product ID using a more robust approach
function extractProductId(item: any): string | null {
  // Check each possible location for product ID in order of preference
  // 1. Direct tcgplayer_product_id field
  if (item.tcgplayer_product_id) {
    return String(item.tcgplayer_product_id);
  }
  
  // 2. In attributes object as tcgplayer_product_id
  if (item.attributes?.tcgplayer_product_id) {
    return String(item.attributes.tcgplayer_product_id);
  }
  
  // 3. Direct product_id field
  if (item.product_id) {
    return String(item.product_id);
  }
  
  // 4. In attributes object as product_id
  if (item.attributes?.product_id) {
    return String(item.attributes.product_id);
  }
  
  // 5. Fallback to item.id
  if (item.id) {
    return String(item.id);
  }
  
  // If none found
  return null;
}
