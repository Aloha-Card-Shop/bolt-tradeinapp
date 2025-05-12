import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { buildCardNumberSearchQuery } from './cardSearchUtils';

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
  
  // Enhanced card number search with proper JSONB path syntax
  if (number) {
    // Get the clean card number string
    const cardNumberStr = typeof number === 'object' ? 
                        (number.displayName || number.value || '') : 
                        number.toString();
                         
    if (DEBUG_MODE) {
      console.log(`Applying card number search for: "${cardNumberStr}"`);
    }
    
    // Create normalized variants of the card number for comprehensive searching
    const variants = generateCardNumberVariants(cardNumberStr);
    
    if (DEBUG_MODE) {
      console.log(`Generated search variants for card number:`, variants);
    }
    
    // Build filter conditions using the correct JSONB path syntax
    const filterConditions: string[] = [];
    
    variants.forEach(variant => {
      // Use the correct JSONB path with text extraction operator ->>
      // Primary path: attributes->'Number'->>'value'
      filterConditions.push(`attributes->'Number'->>'value'.ilike.%${variant}%`);
      
      // Secondary paths for fallback
      filterConditions.push(`attributes->'number'->>'value'.ilike.%${variant}%`);
      filterConditions.push(`attributes->'card_number'->>'value'.ilike.%${variant}%`);
      
      // Alternative paths for some legacy data formats
      filterConditions.push(`attributes->>'card_number'.ilike.%${variant}%`);
    });
    
    // Join filter conditions with commas for Supabase OR syntax
    const orConditionString = filterConditions.join(',');
    
    if (DEBUG_MODE) {
      console.log('Final card number search OR condition:', orConditionString);
    }
    
    // Apply the OR condition to the query
    query = query.or(orConditionString);
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
      number: number ? `Using comprehensive filter syntax with ${typeof number === 'object' ? (number.displayName || number.value || '') : number.toString()}` : 'any'
    });
    
    // Log the raw query SQL for debugging
    if (typeof query.toSQL === 'function') {
      try {
        const sqlDebug = query.toSQL();
        console.log('Generated SQL query:', sqlDebug);
      } catch (e) {
        console.log('Could not extract SQL query for debugging');
      }
    }
  }

  return { query, foundSetIds };
};

// Helper function to generate all possible variants of a card number for search
const generateCardNumberVariants = (cardNumber: string): string[] => {
  if (!cardNumber) return [];
  
  const variants = new Set<string>();
  
  // Add the original number
  variants.add(cardNumber);
  
  // Handle card numbers with slashes (e.g., "004/102")
  if (cardNumber.includes('/')) {
    const [numPart, setPart] = cardNumber.split('/', 2);
    
    // Add variants with/without leading zeros
    if (/^0+\d+$/.test(numPart)) {
      // Strip leading zeros (e.g. "004" -> "4")
      const strippedNum = numPart.replace(/^0+/, '');
      variants.add(`${strippedNum}/${setPart}`);
      variants.add(strippedNum);
    }
    
    // Add just the number part
    variants.add(numPart);
  } 
  // Handle simple numbers
  else if (/^\d+$/.test(cardNumber)) {
    // Add variants with leading zeros for single digits
    if (cardNumber.length === 1) {
      variants.add(`00${cardNumber}`);
      variants.add(`0${cardNumber}`);
    } else if (cardNumber.length === 2) {
      variants.add(`0${cardNumber}`);
    }
    
    // If it has leading zeros, add version without them
    if (/^0+\d+$/.test(cardNumber)) {
      variants.add(cardNumber.replace(/^0+/, ''));
    }
  }
  
  return [...variants];
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
