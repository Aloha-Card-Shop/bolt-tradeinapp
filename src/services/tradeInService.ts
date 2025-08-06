import { supabase } from '../integrations/supabase/client';

export async function deleteTradeIn(tradeInId: string) {
  console.log(`🗑️ Starting deletion of trade-in ${tradeInId}`);
  
  try {
    // First verify the trade-in exists
    const { data: existing, error: checkError } = await supabase
      .from('trade_ins')
      .select('id, customer_id')
      .eq('id', tradeInId)
      .single();
    
    if (checkError) {
      console.error('❌ Error checking trade-in:', checkError);
      throw checkError;
    }
    
    if (!existing) {
      console.error('❌ Trade-in not found:', tradeInId);
      throw new Error('Trade-in not found');
    }

    console.log('📝 Found trade-in to delete:', existing);

    // Delete the trade-in (items will be deleted via CASCADE)
    const { data, error } = await supabase
      .from('trade_ins')
      .delete()
      .eq('id', tradeInId)
      .select();

    if (error) {
      console.error('❌ Failed to delete trade-in:', error);
      throw error;
    }
    
    console.log('✅ Trade-in deleted successfully:', {
      deletedId: tradeInId,
      response: data
    });

    return data;
  } catch (error) {
    console.error('❌ Error in deleteTradeIn:', error);
    throw error;
  }
}