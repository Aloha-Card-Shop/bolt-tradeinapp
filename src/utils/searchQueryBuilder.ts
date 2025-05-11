
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

  // Determine which table to query based on search criteria
  // Use cards table when searching by card number for better performance
  const useCardsTable = number && number.trim().length > 0;
  
  if (DEBUG_MODE) {
    console.log(`Using ${useCardsTable ? 'cards' : 'unified_products'} table for search`);
  }

  // Start building the query with select fields specified to reduce data transfer
  let query;
  
  if (useCardsTable) {
    // Query the cards table when searching by card number (more efficient)
    query = supabase
      .from('cards')
      .select('id, name, set_name, card_number, image_url, attributes', { count: 'exact' })
      .order('name');
  } else {
    // Otherwise query the unified_products table
    query = supabase
      .from('unified_products')
      .select('id, name, group_id, image_url, attributes, product_id, tcgplayer_product_id', { count: 'exact' })
      .order('name');
  }
  
  // Apply pagination
  query = query.range(from, to);

  // Apply filters based on provided card details
  if (useCardsTable) {
    // Apply filters for cards table
    if (categoryId) {
      // Note: cards table might not have category_id, so we don't apply this filter for cards table
      if (DEBUG_MODE) console.log('Category filter not applied to cards table (missing column)');
    }
    
    // Enhanced card number filtering with better partial matching
    if (number) {
      // Get number before slash for partial matching
      const numberBeforeSlash = extractNumberBeforeSlash(number);
      const fullNumber = number.toString();
      const isNumericOnly = /^\d+$/.test(fullNumber);
      
      // Set up a series of OR conditions to match the card number in various ways
      let cardNumberFilters = [];
      
      // Exact match (highest priority)
      cardNumberFilters.push(`card_number.eq.${fullNumber}`);
      
      // Prefix match (starts with search term)
      cardNumberFilters.push(`card_number.ilike.${fullNumber}%`);
      
      // Contains match (number appears anywhere)
      cardNumberFilters.push(`card_number.ilike.%${fullNumber}%`);
      
      // If numeric only, add special partial matching patterns
      if (isNumericOnly) {
        // Match where numeric part is at beginning followed by slash
        cardNumberFilters.push(`card_number.ilike.${fullNumber}/%`);
        
        // Match where numeric part is at end
        cardNumberFilters.push(`card_number.ilike.%${fullNumber}`);
        
        // Special pattern for numbers after a hyphen (like "SW-123")
        cardNumberFilters.push(`card_number.ilike.%-${fullNumber}%`);
      }
      
      // If numberBeforeSlash is different, add those patterns too
      if (numberBeforeSlash && numberBeforeSlash !== fullNumber) {
        cardNumberFilters.push(`card_number.ilike.${numberBeforeSlash}/%`);
      }
      
      // Combine all patterns with OR logic
      query = query.or(cardNumberFilters.join(','));
      
      if (DEBUG_MODE) {
        console.log(`Added enhanced card number filters: ${cardNumberFilters.join(' OR ')}`);
      }
    }
    
    // Set filtering on the set_name column
    if (set) {
      query = query.eq('set_name', set);
      
      // Add set IDs to the foundSetIds set
      const setId = setOptions.find(s => s.name === set)?.id;
      if (setId) {
        foundSetIds.add(setId);
      }
      
      if (DEBUG_MODE) console.log(`Added set filter on cards table: ${set}`);
    }
  } else {
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
    
    // Then apply card number filters which are also restrictive
    if (number) {
      // Get number before slash for partial matching
      const numberBeforeSlash = extractNumberBeforeSlash(number);
      const fullNumber = number.toString();
      
      // Build a combined filter to search in attributes object ONLY, since there's no number column
      let cardNumberFilters: string[] = [];
      
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
        console.log(`Using attributes search with paths: ${possiblePaths.join(', ')}`);
        console.log(`Also searching for partial matches with: ${numberBeforeSlash}`);
      }
    }
  }
  
  // Apply name filter last - this is typically the broadest
  // This filter is the same for both tables
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
    if (useCardsTable) {
      console.log('Final query filters on cards table:', { 
        name: name ? (name.length <= 2 ? `${name}%` : `%${name}%`) : 'any',
        card_number: number ? `Enhanced search for: ${number}` : 'any',
        set_name: set || 'any'
      });
    } else {
      console.log('Final query filters on unified_products table:', { 
        category_id: categoryId || 'any',
        name: name ? (name.length <= 2 ? `${name}%` : `%${name}%`) : 'any',
        set_id: set ? (setOptions.find(s => s.name === set)?.id || 'not found') : 'any',
        number: number ? `Enhanced search for: ${number} (in attributes only)` : 'any'
      });
    }
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
          'No attributes found'
      });
    }
  }
  
  return results.map(item => {
    // Check if this is from cards table or unified_products table
    const isFromCardsTable = item.card_number !== undefined;
    
    // Set name handling - different for the two tables
    let setName = '';
    if (isFromCardsTable) {
      // Direct field for cards table
      setName = item.set_name || '';
    } else {
      // Lookup for unified_products table
      setName = (item.group_id && setOptions.find(s => s.id === item.group_id)?.name) || '';
    }
    
    // Card number extraction - different for the two tables
    let cardNumber = '';
    
    if (isFromCardsTable) {
      // Direct field for cards table
      cardNumber = item.card_number || '';
    } else {
      // Extract from attributes for unified_products table
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
    }
    
    // Extract product ID with improved priority hierarchy
    // For cards table, we might not have a product_id directly
    const productId = isFromCardsTable 
      ? (item.attributes?.tcgplayer_product_id || item.attributes?.tcgplayer_id || null)  // Use tcgplayer_product_id from attributes
      : extractProductId(item);
    
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
