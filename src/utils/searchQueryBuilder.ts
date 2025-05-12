
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
    .select('id, name, group_id, image_url, attributes, product_id, tcgplayer_product_id', { count: 'exact' })
    .order('name');
  
  // Apply pagination
  query = query.range(from, to);

  // Apply filters based on provided card details
  // Apply filters for unified_products table
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
  
  // Enhanced card number search with improved matching for unified_products table
  if (number) {
    // Normalize the card number for more consistent matching
    const normalizedNumber = number.trim().replace(/^0+(\d+)/, '$1'); // Remove leading zeros from numeric part
    const numberBeforeSlash = extractNumberBeforeSlash(number);
    const fullNumber = number.toString();
    
    try {
      // FIX: Correctly use the .or() method in Supabase for JSONB filtering
      // Instead of using a comma-separated string, chain multiple .or() calls
      
      // Start with an empty filter
      let cardNumberFilterApplied = false;
      
      // First check for exact matches
      if (fullNumber) {
        // Use individual .or() calls for different JSONB paths
        query = query.or(`attributes->>number.eq.${fullNumber}`);
        cardNumberFilterApplied = true;
        
        // Add exact matches on other common JSON paths
        query = query.or(`attributes->>Number.eq.${fullNumber}`);
        query = query.or(`attributes->>card_number.eq.${fullNumber}`);
        query = query.or(`attributes->>cardNumber.eq.${fullNumber}`);
        
        // If normalized number is different, add those conditions
        if (normalizedNumber !== fullNumber) {
          query = query.or(`attributes->>number.eq.${normalizedNumber}`);
          query = query.or(`attributes->>Number.eq.${normalizedNumber}`);
          query = query.or(`attributes->>card_number.eq.${normalizedNumber}`);
          query = query.or(`attributes->>cardNumber.eq.${normalizedNumber}`);
        }
        
        // Add partial matches with ILIKE
        query = query.or(`attributes->>number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->>Number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->>card_number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->>cardNumber.ilike.%${fullNumber}%`);
        
        // If we have a number before slash, also search for that pattern
        if (numberBeforeSlash && numberBeforeSlash !== fullNumber) {
          query = query.or(`attributes->>number.ilike.${numberBeforeSlash}/%`);
          query = query.or(`attributes->>Number.ilike.${numberBeforeSlash}/%`);
          query = query.or(`attributes->>card_number.ilike.${numberBeforeSlash}/%`);
          query = query.or(`attributes->>cardNumber.ilike.${numberBeforeSlash}/%`);
        }
        
        // Add searches for nested properties paths
        query = query.or(`attributes->properties->>number.eq.${fullNumber}`);
        query = query.or(`attributes->properties->>Number.eq.${fullNumber}`);
        query = query.or(`attributes->properties->>card_number.eq.${fullNumber}`);
        query = query.or(`attributes->properties->>cardNumber.eq.${fullNumber}`);
        
        // Add partial matches for properties path
        query = query.or(`attributes->properties->>number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->properties->>Number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->properties->>card_number.ilike.%${fullNumber}%`);
        query = query.or(`attributes->properties->>cardNumber.ilike.%${fullNumber}%`);
      }
      
      if (DEBUG_MODE) {
        console.log(`Applied card number filter for: ${number}`);
        console.log(`Using proper Supabase chained .or() syntax for JSONB queries`);
      }
      
      // If no card number filter was applied (unlikely but possible), add a simple one
      if (!cardNumberFilterApplied && fullNumber) {
        // Basic fallback filter
        query = query.or(`attributes->>Number.eq.${fullNumber},attributes->>number.eq.${fullNumber}`);
        
        if (DEBUG_MODE) {
          console.log(`Applied fallback card number filter for: ${number}`);
        }
      }
    } catch (error) {
      // Handle any syntax errors in the filter generation
      console.error("Error building card number filter:", error);
      if (DEBUG_MODE) {
        console.error("Failed to build card number filter with advanced syntax, falling back to simpler filter");
      }
      
      // Basic fallback - we'll use a simpler approach that's more reliable
      query = query.or(`attributes->>number.eq.${fullNumber}`);
      query = query.or(`attributes->>Number.eq.${fullNumber}`);
      
      if (DEBUG_MODE) {
        console.log(`Applied simple fallback card number filter for: ${number}`);
      }
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
      number: number ? `Using proper Supabase chained .or() syntax for JSONB queries: ${number}` : 'any'
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
  setOptions: SetOption[],
  searchCriteria: CardDetails
): CardDetails[] => {
  if (DEBUG_MODE) {
    console.log(`Formatting ${results.length} raw results to CardDetails objects`);
    
    // Log a sample of the results to help debug JSON structure
    if (results.length > 0) {
      console.log('Sample result attributes structure:', {
        firstRecord: results[0],
        attributesStructure: results[0].attributes ? 
          JSON.stringify(results[0].attributes).substring(0, 200) + '...' :
          'No attributes found'
      });
    }
  }
  
  return results.map(item => {
    // We're now always using unified_products table so handling is simplified
    
    // Set name lookup for unified_products table
    const setName = (item.group_id && setOptions.find(s => s.id === item.group_id)?.name) || '';
    
    // Card number extraction from attributes
    let cardNumber = '';
    
    if (item.attributes) {
      try {
        // Log the actual attributes structure for better debugging
        if (DEBUG_MODE && item.name.includes(searchCriteria.name || '')) {
          console.log(`Card "${item.name}" attributes:`, item.attributes);
        }
        
        // Try various paths for the card number in the attributes object
        if (typeof item.attributes === 'object') {
          // Direct properties at the root level
          if (item.attributes.number !== undefined) {
            cardNumber = typeof item.attributes.number === 'object' 
              ? (item.attributes.number.value || item.attributes.number.displayName || '') 
              : String(item.attributes.number);
          } 
          else if (item.attributes.Number !== undefined) {
            cardNumber = typeof item.attributes.Number === 'object'
              ? (item.attributes.Number.value || item.attributes.Number.displayName || '')
              : String(item.attributes.Number);
          }
          else if (item.attributes.card_number !== undefined) {
            cardNumber = typeof item.attributes.card_number === 'object'
              ? (item.attributes.card_number.value || item.attributes.card_number.displayName || '')
              : String(item.attributes.card_number);
          }
          // Look for a properties field that might contain the number
          else if (item.attributes.properties && typeof item.attributes.properties === 'object') {
            const props = item.attributes.properties;
            if (props.number) {
              cardNumber = typeof props.number === 'object' 
                ? (props.number.value || props.number.displayName || '') 
                : String(props.number);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to parse attributes for card "${item.name}":`, error);
      }
    }
    
    // Extract product ID with improved priority hierarchy
    const productId = extractProductId(item);
    
    // Debug output to trace productId extraction
    if (DEBUG_MODE && cardNumber) {
      console.log(`Card: ${item.name}, Number: ${cardNumber}, Extracted ID: ${productId}`);
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
