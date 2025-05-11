
import { supabase } from '../lib/supabase';
import { TradeIn } from '../types/tradeIn';
import { toast } from 'react-hot-toast';

export const printService = {
  // Print a barcode label for a trade-in
  printTradeInBarcode: async (tradeIn: TradeIn, printerId: string) => {
    try {
      // Call edge function to print barcode (will be implemented later)
      const { data, error } = await supabase.functions.invoke('print-barcode', {
        body: {
          tradeInId: tradeIn.id,
          printerId: printerId
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
      
      toast.success('Barcode sent to printer');
      return data;
    } catch (err) {
      console.error('Error printing barcode:', err);
      toast.error(`Failed to print barcode: ${(err as Error).message}`);
      throw err;
    }
  }
};
