
import { supabase } from '../lib/supabase';

export interface VariantAvailability {
  normal: boolean;
  firstEdition: boolean;
  holo: boolean;
  reverseHolo: boolean;
  unlimited: boolean;
  firstEditionHolo: boolean;
  unlimitedHolo: boolean;
}

export const getCardVariantAvailability = async (
  productId?: string | null,
  cardName?: string,
  setName?: string
): Promise<VariantAvailability> => {
  const defaultAvailability: VariantAvailability = {
    normal: false,
    firstEdition: false,
    holo: false,
    reverseHolo: false,
    unlimited: false,
    firstEditionHolo: false,
    unlimitedHolo: false
  };

  try {
    console.log('getCardVariantAvailability called with:', { productId, cardName, setName });

    let query = supabase
      .from('unified_products')
      .select('product_id, name, normal, first_edition, holofoil, reverse_holofoil, unlimited, first_edition_holofoil, unlimited_holofoil');

    // First try to match by product_id if available
    if (productId) {
      const numericProductId = parseInt(productId);
      if (!isNaN(numericProductId)) {
        console.log('Querying by product_id:', numericProductId);
        query = query.eq('product_id', numericProductId);
      }
    } else if (cardName && setName) {
      // Fallback to name and set matching
      console.log('Querying by name and set:', { cardName, setName });
      
      // First try exact name match with group lookup
      const { data: groupData } = await supabase
        .from('groups')
        .select('groupid')
        .ilike('name', `%${setName}%`)
        .limit(1)
        .single();

      if (groupData) {
        console.log('Found group for set:', groupData.groupid);
        query = query
          .ilike('name', `%${cardName}%`)
          .eq('group_id', groupData.groupid);
      } else {
        // Fallback to just name matching
        console.log('No group found, using name only');
        query = query.ilike('name', `%${cardName}%`);
      }
    } else {
      console.log('No valid search parameters provided');
      return defaultAvailability;
    }

    const { data, error } = await query.limit(5); // Get multiple to see what we're matching

    console.log('Query result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return defaultAvailability;
    }

    if (!data || data.length === 0) {
      console.log('No variant data found for card:', { productId, cardName, setName });
      return defaultAvailability;
    }

    // Use the first result but log all matches
    const firstResult = data[0];
    console.log('Using first result:', firstResult);
    console.log('All matches found:', data);

    const result = {
      normal: firstResult.normal?.toLowerCase() === 'yes',
      firstEdition: firstResult.first_edition?.toLowerCase() === 'yes',
      holo: firstResult.holofoil?.toLowerCase() === 'yes',
      reverseHolo: firstResult.reverse_holofoil?.toLowerCase() === 'yes',
      unlimited: firstResult.unlimited?.toLowerCase() === 'yes',
      firstEditionHolo: firstResult.first_edition_holofoil?.toLowerCase() === 'yes',
      unlimitedHolo: firstResult.unlimited_holofoil?.toLowerCase() === 'yes'
    };

    console.log('Final availability result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching variant availability:', error);
    return defaultAvailability;
  }
};
