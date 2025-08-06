
import { supabase } from '../integrations/supabase/client';
import { TradeIn } from '../types/tradeIn';
import { toast } from 'react-hot-toast';

export const printService = {
  // Print a barcode label for a trade-in
  printTradeInBarcode: async (tradeIn: TradeIn, printerId: string, templateId: string | null = null, cardId: string | null = null) => {
    try {
      // Call edge function to print barcode
      const { data, error } = await supabase.functions.invoke('print-barcode', {
        body: {
          tradeInId: tradeIn.id,
          printerId: printerId,
          templateId: templateId,
          cardId: cardId
        }
      });

      if (error) throw error;
      
      // Update trade-in record with print information
      const { error: updateError } = await supabase
        .from('trade_ins')
        .update({
          printed: true,
          print_count: tradeIn.print_count ? tradeIn.print_count + 1 : 1,
          last_printed_at: new Date().toISOString(),
          printed_by: (await supabase.auth.getUser()).data.user?.id,
          printer_id: printerId
        })
        .eq('id', tradeIn.id);
      
      if (updateError) throw updateError;
      
      toast.success(cardId ? 'Card barcode sent to printer' : 'Barcode sent to printer');
      return data;
    } catch (err) {
      console.error('Error printing barcode:', err);
      toast.error(`Failed to print barcode: ${(err as Error).message}`);
      throw err;
    }
  },

  // Print a barcode label for a specific card
  printCardBarcode: async (tradeIn: TradeIn, cardId: string, printerId: string, templateId: string | null = null) => {
    return printService.printTradeInBarcode(tradeIn, printerId, templateId, cardId);
  }
};
