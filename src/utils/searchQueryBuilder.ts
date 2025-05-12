
import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';
import { SetOption } from '../hooks/useSetOptions';
import { generateCardNumberVariants } from './cardSearchUtils';

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
  
  // Enhanced card number search with proper OR conditions and fixed JSONB path expressions
  if (number) {
    try {
      // Generate all possible card number variants for comprehensive search
      const cardNumberVariants = generateCardNumberVariants(number);
      
      if (DEBUG_MODE) {
        console.log(`Searching for card number variants:`, cardNumberVariants);
      }
      
      // Create array of filter conditions for all variants
      const filterConditions: string[] = [];
      
      // Generate filter conditions for each variant with proper JSONB path expressions
      cardNumberVariants.forEach(variant => {
        // Use ->> for text extraction from JSONB before applying text operators
        // Direct properties at root level - as value
        filterConditions.push(`attributes->>'number'.eq.${variant}`);
        filterConditions.push(`attributes->>'Number'.eq.${variant}`);
        
        // Nested object properties - value inside object
        // Extract text with ->> before applying .eq
        filterConditions.push(`attributes->'number'->>'value'.eq.${variant}`);
        filterConditions.push(`attributes->'Number'->>'value'.eq.${variant}`);
        
        // Card number field
        filterConditions.push(`attributes->>'card_number'.eq.${variant}`);
        filterConditions.push(`attributes->'card_number'->>'value'.eq.${variant}`);
        
        // For numbers that might be part of a pattern with slash
        if (!variant.includes('/')) {
          // Proper text extraction with ->> before applying .ilike
          filterConditions.push(`attributes->'number'->>'value'.ilike.${variant}/%`);
          filterConditions.push(`attributes->'Number'->>'value'.ilike.${variant}/%`);
          filterConditions.push(`attributes->>'number'.ilike.${variant}/%`);
          filterConditions.push(`attributes->>'Number'.ilike.${variant}/%`);
        }
      });
      
      // Log the generated filter conditions
      if (DEBUG_MODE) {
        console.log(`Generated ${filterConditions.length} filter conditions for card number search`);
        console.log('Filter conditions:', filterConditions);
      }
      
      // Apply the filter conditions with OR logic - using the proper Supabase syntax
      if (filterConditions.length > 0) {
        // Join all conditions with comma for supabase .or() method
        const orConditionString = filterConditions.join(',');
        query = query.or(orConditionString);
        
        if (DEBUG_MODE) {
          console.log('Applied OR condition string:', orConditionString);
        }
      }
    } catch (error) {
      // Handle any syntax errors in the filter generation
      console.error("Error building card number filter:", error);
      
      // Fallback to a simpler approach
      try {
        // Basic fallback with simpler syntax for direct property access
        const originalNumber = typeof number === 'object' ? (number.displayName || number.value || '') : number.toString();
        // Use ->> for text extraction before applying .eq
        query = query.or(`attributes->>'number'.eq.${originalNumber},attributes->>'Number'.eq.${originalNumber}`);
        
        if (DEBUG_MODE) {
          console.log(`Applied simplified fallback card number filter for "${originalNumber}"`);
        }
      } catch (secondError) {
        console.error("Even fallback filter failed:", secondError);
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
      number: number ? `Using comprehensive filter syntax with ${typeof number === 'object' ? (number.displayName || number.value || '') : number.toString()}` : 'any'
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
