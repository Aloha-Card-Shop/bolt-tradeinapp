
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

  // Start building the query with select fields specified to reduce data transfer
  let query = supabase
    .from('unified_products')
    .select('id, name, group_id, image_url, attributes, product_id, number', { count: 'exact' })
    .order('name')
    .range(from, to);

  // Apply filters based on provided card details - order from most to least restrictive for better performance
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
  
  // Then apply card number filters which are also restrictive
  if (number) {
    // Get number before slash for partial matching
    const numberBeforeSlash = extractNumberBeforeSlash(number);
    const fullNumber = number.toString();
    
    // Build a combined filter to search in multiple locations:
    // 1. Direct root-level "number" field
    // 2. Within attributes object
    let cardNumberFilters = [];
    
    // Root level number field direct searches
    cardNumberFilters.push(`number.ilike.%${fullNumber}%`); // Contains full number
    
    // If we have a partial number, also search for that
    if (numberBeforeSlash && numberBeforeSlash !== fullNumber) {
      cardNumberFilters.push(`number.ilike.${numberBeforeSlash}/%`); // Starts with number before slash
    }
    
    // Attributes-level searches for different possible paths
    const possiblePaths = ['number', 'Number', 'card_number', 'cardNumber'];
    
    possiblePaths.forEach(path => {
      // Full number match within attributes
      cardNumberFilters.push(`attributes->${path}.ilike.%${fullNumber}%`);
      
      // Partial number match within attributes (if applicable)
      if (numberBeforeSlash && numberBeforeSlash !== fullNumber) {
        cardNumberFilters.push(`attributes->${path}.ilike.${numberBeforeSlash}/%`);
      }
    });
    
    // Use OR logic to match any of these paths
    query = query.or(cardNumberFilters.join(','));
    
    if (DEBUG_MODE) {
      console.log(`Added enhanced card number filter for: ${number}`);
      console.log(`Using root-level and attributes search with paths: ${possiblePaths.join(', ')}`);
      console.log(`Also searching for partial matches with: ${numberBeforeSlash}`);
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

  // Log the raw query for debugging
  if (DEBUG_MODE) {
    console.log('Final query filters:', { 
      category_id: categoryId || 'any',
      name: name ? (name.length <= 2 ? `${name}%` : `%${name}%`) : 'any',
      set_id: set ? (setOptions.find(s => s.name === set)?.id || 'not found') : 'any',
      number: number ? `Enhanced search for: ${number} (including root and attributes)` : 'any'
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
    
    // Log a sample of the results to help debug JSON structure
    if (results.length > 0) {
      console.log('Sample result attributes structure:', {
        firstRecord: results[0],
        attributesStructure: results[0].attributes ? 
          JSON.stringify(results[0].attributes).substring(0, 200) + '...' :
          'No attributes found',
        rootNumber: results[0].number || 'No root number field'
      });
    }
  }
  
  return results.map(item => {
    // Set name lookup - use group_id to find the set name from setOptions
    const setName = (item.group_id && setOptions.find(s => s.id === item.group_id)?.name) || '';
    
    // Enhanced card number extraction with priority on root-level number field
    let cardNumber = '';
    
    // First check the root-level number field
    if (item.number) {
      cardNumber = item.number;
      
      if (DEBUG_MODE) {
        console.log(`Found root-level card number for ${item.name}: ${cardNumber}`);
      }
    }
    // If not found at root level, try the attributes object
    else if (item.attributes) {
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
  // 1. Direct product_id field
  if (item.product_id) {
    return String(item.product_id);
  }
  
  // 2. In attributes object as product_id
  if (item.attributes?.product_id) {
    return String(item.attributes.product_id);
  }
  
  // 3. Fallback to item.id
  if (item.id) {
    return String(item.id);
  }
  
  // If none found
  return null;
}
