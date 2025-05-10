
// src/services/cardService.ts

import { supabase } from '../lib/supabase';
import { CardDetails } from '../types/card';

export async function getOrCreateCard(card: CardDetails): Promise<string> {
  // 1) Basic validation
  if (!card) {
    throw new Error("Card is undefined in getOrCreateCard");
  }
  if (!card.name || !card.game) {
    throw new Error(
      `Invalid card data: missing required fields. Name: ${card.name}, Game: ${card.game}`
    );
  }

  try {
    // 2) If we already have an ID, try to verify it—but use maybeSingle to avoid 406
    if (card.id) {
      const { data: existingById, error: verifyError } = await supabase
        .from('cards')
        .select('id')
        .eq('id', card.id)
        .maybeSingle();

      if (verifyError) {
        console.warn('Error verifying existing card ID:', verifyError);
      } else if (existingById?.id) {
        console.log('Found existing card by ID:', existingById.id);
        return existingById.id;
      }
    }

    // 3) Look up by name + game
    const { data: existingByName, error: searchError } = await supabase
      .from('cards')
      .select('id')
      .eq('name', card.name)
      .eq('game', card.game)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for card:', searchError);
      throw new Error(`Error searching for card: ${searchError.message}`);
    }
    if (existingByName?.id) {
      console.log('Found existing card by name and game:', existingByName.id);
      return existingByName.id;
    }

    // 4) No existing card—create a new one
    console.log('Creating new card:', {
      name: card.name,
      game: card.game,
      set: card.set,
      number: card.number,
      productId: card.productId
    });

    const { data: newCard, error: insertError } = await supabase
      .from('cards')
      .insert({
        name: card.name,
        game: card.game,
        set_name: card.set || null,
        card_number: card.number || null,
        image_url: card.imageUrl || null,
        attributes: { 
          // Store product ID in both field formats for maximum compatibility
          tcgplayer_id: card.productId || null,
          tcgplayer_product_id: card.productId || null,
          // Save additional details for future reference
          source: 'trade-in-app',
          created_at: new Date().toISOString()
        }
      })
      .select('id')
      .single(); // safe here because we expect exactly one row

    if (insertError) {
      console.error('Error creating card:', insertError);
      throw new Error(`Error creating card: ${insertError.message}`);
    }
    if (!newCard?.id) {
      throw new Error('Failed to create card: no ID returned');
    }

    console.log('Successfully created new card:', newCard.id);
    return newCard.id;

  } catch (err) {
    console.error('Error in getOrCreateCard:', err);
    throw err;
  }
}
