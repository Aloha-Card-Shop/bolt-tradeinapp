
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TradeIn } from '../types/tradeIn';
import { deleteTradeIn } from '../services/tradeInService';

export const useTradeInActions = (setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApproveTradeIn = async (tradeInId: string) => {
    setActionLoading(tradeInId);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // First, update the trade-in status
      const { error: updateError } = await supabase
        .from('trade_ins')
        .update({ 
          status: 'accepted',
          handled_at: new Date().toISOString(),
          handled_by: currentUser.id
        })
        .eq('id', tradeInId);

      if (updateError) throw updateError;

      // Get all trade-in items with card data for this trade-in to create inventory records
      const { data: tradeInItems, error: itemsError } = await supabase
        .from('trade_in_items')
        .select(`
          *,
          cards:card_id (
            tcgplayer_url
          )
        `)
        .eq('trade_in_id', tradeInId);

      if (itemsError) throw itemsError;

      if (tradeInItems && tradeInItems.length > 0) {
        // Import SKU generator
        const { generateSku } = await import('../utils/skuGenerator');
        
        // Create inventory records for each trade-in item
        const inventoryRecords = tradeInItems.map(item => {
          // Generate SKU for this item
          let sku = 'UNKNOWN';
          
          const cardData = item.cards as any;
          if (cardData?.tcgplayer_url || item.attributes) {
            const tcgplayerId = cardData?.tcgplayer_url ? 
              cardData.tcgplayer_url.match(/\/(\d+)/)?.[1] : undefined;
            
            const certificationData = {
              isCertified: !!item.attributes?.isCertified,
              certNumber: item.attributes?.certNumber,
              grade: item.attributes?.grade
            };
            
            sku = generateSku(
              tcgplayerId,
              !!item.attributes?.isFirstEdition,
              !!item.attributes?.isHolo,
              item.condition,
              false, // isReverseHolo - default to false
              certificationData
            );
          }
          
          return {
            trade_in_item_id: item.id,
            card_id: item.card_id,
            trade_in_price: item.price,
            processed_by: currentUser.id,
            processed_at: new Date().toISOString(),
            status: 'available',
            shopify_synced: false,
            printed: false,
            print_count: 0,
            // Store SKU in notes field for now since there's no dedicated SKU column
            notes: `SKU: ${sku}`
          };
        });

        const { error: inventoryError } = await supabase
          .from('card_inventory')
          .insert(inventoryRecords);

        if (inventoryError) {
          console.error('Error creating inventory records:', inventoryError);
          // Continue with the approval even if inventory creation fails
          // This prevents the trade-in from being stuck in pending state
        }
      }

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? {...tradeIn, status: 'accepted'} : tradeIn
      ));
    } catch (err) {
      console.error('Error approving trade-in:', err);
      setErrorMessage(`Failed to approve trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyTradeIn = async (tradeInId: string) => {
    setActionLoading(tradeInId);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ 
          status: 'rejected', // Changed from 'cancelled' to 'rejected' to match the allowed values
          handled_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeInId);

      if (error) throw error;

      // Update local state
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? {...tradeIn, status: 'rejected'} : tradeIn
      ));
    } catch (err) {
      console.error('Error denying trade-in:', err);
      setErrorMessage(`Failed to deny trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTradeIn = async (tradeInId: string) => {
    if (!confirm('Are you sure you want to delete this trade-in? This action cannot be undone.')) {
      return;
    }

    setActionLoading(tradeInId);
    try {
      await deleteTradeIn(tradeInId);
      
      // Update local state
      setTradeIns(prev => prev.filter(tradeIn => tradeIn.id !== tradeInId));
    } catch (err) {
      console.error('Error deleting trade-in:', err);
      setErrorMessage(`Failed to delete trade-in: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    actionsErrorMessage: errorMessage,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  };
};
