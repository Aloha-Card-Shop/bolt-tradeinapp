import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { extractNumberBeforeSlash } from './cardSearchUtils';

// Debug mode flag - set to true to enable verbose logging
const DEBUG_MODE = true;

// Define the number of results per page
export const RESULTS_PER_PAGE = 48;

// Utility function to build the Supabase query with optimized performance
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

  // Always use unified_products table for all searches for consistency
  if (DEBUG_MODE) {
    console.log('Using unified_products table for all searches');
  }

  // Start building the query with select fields specified to reduce data transfer
  let query = supabase
    .from('unified_products')
    .select('id, name, group_id, image_url, attributes, product_id, tcgplayer_product_id, card_number', { count: 'exact' })
    .order('name');
  
  // Apply pagination
  query = query.range(from, to);

  // Apply filters based on provided card details
  if (categoryId) {
    query = query.eq('category_id', categoryId);
    if (DEBUG_MODE) console.log(`Added category filter: ${categoryId}`);
  }
  
  // Optimize set filtering first since it's highly restrictive
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
  
  // Enhanced card number search using the dedicated card_number column
  if (number) {
    // Normalize the card number for more consistent matching
    const normalizedNumber = number.trim().replace(/^0+(\d+)/, '$1'); // Remove leading zeros from numeric part
    const numberBeforeSlash = extractNumberBeforeSlash(number);
    const fullNumber = number.toString();
    
    // Build card number filters for direct column search instead of JSON attribute search
    let cardNumberFilters = [];
    
    // Exact match (highest priority)
    cardNumberFilters.push(`card_number.eq.${fullNumber}`);
    
    // Also try with normalized number (without leading zeros)
    if (normalizedNumber !== fullNumber) {
      cardNumberFilters.push(`card_number.eq.${normalizedNumber}`);
    }
    
    // Case-insensitive contains match
    cardNumberFilters.push(`card_number.ilike.%${fullNumber}%`);
    
    // Match with normalized number (without leading zeros)
    if (normalizedNumber !== fullNumber) {
      cardNumberFilters.push(`card_number.ilike.%${normalizedNumber}%`);
    }
    
    // For pattern like "4/102", also check for "004/102"
    if (fullNumber.includes('/') && normalizedNumber !== fullNumber) {
      const parts = fullNumber.split('/');
      if (parts.length === 2) {
        const paddedNumber = parts[0].padStart(3, '0') + '/' + parts[1];
        cardNumberFilters.push(`card_number.eq.${paddedNumber}`);
        cardNumberFilters.push(`card_number.ilike.${paddedNumber}%`);
      }
    }
    
    // Partial number match (if applicable)
    if (numberBeforeSlash && numberBeforeSlash !== fullNumber) {
      cardNumberFilters.push(`card_number.ilike.${numberBeforeSlash}/%`);
    }
    
    // Use OR logic to match any of these patterns
    query = query.or(cardNumberFilters.join(','));
    
    if (DEBUG_MODE) {
      console.log(`Added enhanced card number filter for: ${number}`);
      console.log(`Using direct card_number column search`);
      console.log(`Also searching for normalized form: ${normalizedNumber}`);
      console.log(`And partial matches with: ${numberBeforeSlash}`);
    }
  }
  
  // Apply name filter last - this is typically the broadest
  if (name) {
    // For names, use startsWith search first (more efficient) with ilike as fallback
    if (name.length <= 2) {
      // For very short names, use more restrictive startsWith pattern
      query = query.ilike('name', `${name}%`);
      if (DEBUG_MODE) console.log(`Added restrictive name prefix filter: ${name}%`);
    } else {
      // For longer names, use contains pattern
      query = query.ilike('name', `%${name}%`);
      if (DEBUG_MODE) console.log(`Added name contains filter: %${name}%`);
    }
  }

  // Log the final query filters for debugging
  if (DEBUG_MODE) {
    console.log('Final query filters on unified_products table:', { 
      category_id: categoryId || 'any',
      name: name ? (name.length <= 2 ? `${name}%` : `%${name}%`) : 'any',
      set_id: set ? (setOptions.find(s => s.name === set)?.id || 'not found') : 'any',
      number: number ? `Direct search on card_number column with multiple patterns for: ${number}` : 'any'
    });
  }

  return { query, foundSetIds };
};

// Helper function to extract set ID for a set name
export const findSetIdByName = (setName: string, setOptions: SetOption[]): number | undefined => {
  const setOption = setOptions.find(option => option.name === setName);
  return setOption?.id;
};

export const formatResultsToCardDetails = (
  results: any[],
  setOptions: any[] = [],
  searchCriteria: CardDetails
): CardDetails[] => {
  if (DEBUG_MODE) {
    console.log(`Formatting ${results.length} raw results to CardDetails objects`);
    
    // Log a sample of the results to help debug structure
    if (results.length > 0) {
      console.log('Sample result structure:', {
        firstRecord: results[0],
        hasCardNumber: results[0].card_number !== undefined,
        cardNumberValue: results[0].card_number || 'Not available'
      });
    }
  }
  
  return results.map(item => {
    // Set name lookup for unified_products table
    const setName = (item.group_id && setOptions.length > 0 && 
      setOptions.find((s:any) => s.id === item.group_id)?.name) || '';
    
    // Use the direct card_number column instead of extracting from attributes
    let cardNumber = item.card_number || '';

    // If card_number from the direct column is empty, fall back to the attributes as a last resort
    if (!cardNumber && item.attributes) {
      try {
        if (DEBUG_MODE && item.name.includes(searchCriteria.name || '')) {
          console.log(`Card "${item.name}" missing card_number column value, falling back to attributes`);
        }
        
        // This fallback logic is just temporary until the database is fully migrated
        if (typeof item.attributes === 'object') {
          if (item.attributes.number) {
            cardNumber = typeof item.attributes.number === 'object' 
              ? (item.attributes.number.value || item.attributes.number.displayName || '') 
              : String(item.attributes.number);
          } 
          else if (item.attributes.Number) {
            cardNumber = typeof item.attributes.Number === 'object'
              ? (item.attributes.Number.value || item.attributes.Number.displayName || '')
              : String(item.attributes.Number);
          }
        }
      } catch (error) {
        console.error(`Failed to extract fallback card number for "${item.name}":`, error);
      }
    }
    
    // Extract product ID with improved priority hierarchy
    const productId = extractProductId(item);
    
    // Debug output to trace card number usage
    if (DEBUG_MODE && cardNumber) {
      console.log(`Card: ${item.name}, Using card_number column: ${item.card_number !== undefined}, Value: ${cardNumber}`);
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
  // 1. Direct tcgplayer_product_id field (new field added in migration)
  if (item.tcgplayer_product_id) {
    if (DEBUG_MODE) console.log(`Found product ID in tcgplayer_product_id: ${item.tcgplayer_product_id}`);
    return String(item.tcgplayer_product_id);
  }
  
  // 2. Direct product_id field
  if (item.product_id) {
    if (DEBUG_MODE) console.log(`Found product ID in product_id: ${item.product_id}`);
    return String(item.product_id);
  }
  
  // 3. In attributes object as tcgplayer_id (actual field used in database)
  if (item.attributes?.tcgplayer_id) {
    if (DEBUG_MODE) console.log(`Found product ID in attributes.tcgplayer_id: ${item.attributes.tcgplayer_id}`);
    return String(item.attributes.tcgplayer_id);
  }
  
  // 4. In attributes object as product_id
  if (item.attributes?.product_id) {
    if (DEBUG_MODE) console.log(`Found product ID in attributes.product_id: ${item.attributes.product_id}`);
    return String(item.attributes.product_id);
  }
  
  // 5. In attributes object as tcgplayer_product_id
  if (item.attributes?.tcgplayer_product_id) {
    if (DEBUG_MODE) console.log(`Found product ID in attributes.tcgplayer_product_id: ${item.attributes.tcgplayer_product_id}`);
    return String(item.attributes.tcgplayer_product_id);
  }
  
  // 6. Fallback to item.id
  if (item.id) {
    if (DEBUG_MODE) console.log(`No specific product ID found, using item.id: ${item.id}`);
    return String(item.id);
  }
  
  // If none found
  if (DEBUG_MODE) console.log(`No product ID found for item: ${item.name || 'Unknown'}`);
  return null;
}
