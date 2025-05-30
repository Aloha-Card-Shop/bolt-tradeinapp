
import { supabase } from '../lib/supabase';

export interface VariantAvailability {
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
    firstEdition: false,
    holo: false,
    reverseHolo: false,
    unlimited: false,
    firstEditionHolo: false,
    unlimitedHolo: false
  };

  try {
    let query = supabase
      .from('unified_products')
      .select('first_edition, holofoil, reverse_holofoil, unlimited, first_edition_holofoil, unlimited_holofoil');

    // First try to match by product_id if available
    if (productId) {
      const numericProductId = parseInt(productId);
      if (!isNaN(numericProductId)) {
        query = query.eq('product_id', numericProductId);
      }
    } else if (cardName && setName) {
      // Fallback to name and set matching
      query = query
        .ilike('name', `%${cardName}%`)
        .or(`group_id.in.(select groupid from groups where name ilike '%${setName}%')`);
    } else {
      return defaultAvailability;
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      console.log('No variant data found for card:', { productId, cardName, setName });
      return defaultAvailability;
    }

    return {
      firstEdition: data.first_edition?.toLowerCase() === 'yes',
      holo: data.holofoil?.toLowerCase() === 'yes',
      reverseHolo: data.reverse_holofoil?.toLowerCase() === 'yes',
      unlimited: data.unlimited?.toLowerCase() === 'yes',
      firstEditionHolo: data.first_edition_holofoil?.toLowerCase() === 'yes',
      unlimitedHolo: data.unlimited_holofoil?.toLowerCase() === 'yes'
    };
  } catch (error) {
    console.error('Error fetching variant availability:', error);
    return defaultAvailability;
  }
};
