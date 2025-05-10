
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;

// Define the number of results per page
export const RESULTS_PER_PAGE = 48;

// Utility function to build the Supabase query
export const buildSearchQuery = async (
  cardDetails: CardDetails,
  setOptions: SetOption[],
  page: number = 0
): Promise<{ query: any; foundSetIds: Set<number> }> => {
  // Destructure card details for easier use
  const { name, set, number, categoryId } = cardDetails;

  // Initialize set to store found set IDs
  const foundSetIds: Set<number> = new Set();

  // Calculate the range for pagination
  const from = page * RESULTS_PER_PAGE;
  const to = (page + 1) * RESULTS_PER_PAGE - 1;

  if (DEBUG_MODE) {
    console.log('🔧 Building search query with parameters:', { 
      name, 
      set, 
      number, 
      categoryId,
      pagination: { page, from, to }
    });
  }

  // Start building the query
  let query = supabase
    .from('unified_products')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to);

  // Apply filters based on provided card details
  if (categoryId) {
    query = query.eq('category_id', categoryId);
    if (DEBUG_MODE) console.log(`Added category filter: ${categoryId}`);
  }
  
  if (name) {
    query = query.ilike('name', `%${name}%`);
    if (DEBUG_MODE) console.log(`Added name filter: %${name}%`);
  }
  
  if (set) {
    const setId = setOptions.find(s => s.name === set)?.id;
    if (setId) {
      query = query.eq('group_id', setId);
      foundSetIds.add(setId);
      if (DEBUG_MODE) console.log(`Added set filter, mapped "${set}" to ID: ${setId}`);
    } else if (DEBUG_MODE) {
      console.warn(`Set "${set}" not found in setOptions`);
    }
  }
  
  // Search for card numbers through the attributes JSON field
  if (number) {
    // Handle card number search within JSON attributes
    // First try searching in number attribute with direct value
    query = query.or(`attributes->>number.ilike.%${number}%,attributes->Number->>value.ilike.%${number}%,attributes->>card_number.ilike.%${number}%`);
    
    if (DEBUG_MODE) console.log(`Added attributes JSON number filter: %${number}%`);
  }

  // Log the raw query for debugging
  if (DEBUG_MODE) {
    // This is a best-effort representation of the query
    console.log('Final query filters:', { 
      category_id: categoryId || 'any',
      name: name ? `%${name}%` : 'any',
      set_id: set ? (setOptions.find(s => s.name === set)?.id || 'not found') : 'any',
      number: number ? `Searching in attributes JSON for: ${number}` : 'any'
    });
  }

  return { query, foundSetIds };
};

export const formatResultsToCardDetails = (
  results: any[],
  setOptions: SetOption[],
  searchCriteria: CardDetails
): CardDetails[] => {
  if (DEBUG_MODE) {
    console.log(`Formatting ${results.length} raw results to CardDetails objects`);
  }
  
  return results.map(item => {
    // Set name lookup
    const setName = item.group_name || 
      (item.group_id && setOptions.find(s => s.id === item.group_id)?.name) || 
      '';
    
    // Enhanced card number extraction with better handling of JSON attributes
    let cardNumber = '';
    
    if (item.number) {
      cardNumber = item.number;
    } else if (item.attributes) {
      // Try various common paths for card numbers in the attributes object
      if (item.attributes.number) {
        cardNumber = typeof item.attributes.number === 'object' ? 
                    (item.attributes.number.value || item.attributes.number.displayName || '') : 
                    String(item.attributes.number);
      } else if (item.attributes.Number) {
        cardNumber = typeof item.attributes.Number === 'object' ? 
                    (item.attributes.Number.value || item.attributes.Number.displayName || '') : 
                    String(item.attributes.Number);
      } else if (item.attributes.card_number) {
        cardNumber = typeof item.attributes.card_number === 'object' ? 
                    (item.attributes.card_number.value || item.attributes.card_number.displayName || '') : 
                    String(item.attributes.card_number);
      }
    }
    
    // Extract product ID with improved priority hierarchy
    const productId = extractProductId(item);
    
    // Debug output to trace productId extraction
    if (DEBUG_MODE) {
      console.log(`Card: ${item.name}, Extracted ID: ${productId}, Raw ID sources:`, {
        direct_id: item.id,
        tcgplayer_id: item.tcgplayer_product_id,
        product_id: item.product_id,
        attrs_tcgplayer: item.attributes?.tcgplayer_product_id,
        attrs_product: item.attributes?.product_id
      });
      
      if (cardNumber) {
        console.log(`Found card number for ${item.name}: ${cardNumber} from`, {
          direct_number: item.number,
          attrs_number: item.attributes?.number,
          attrs_Number: item.attributes?.Number,
          attrs_card_number: item.attributes?.card_number
        });
      }
    }

    return {
      name: item.name || item.clean_name || '',
      set: setName,
      number: cardNumber,
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
