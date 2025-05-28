import { supabase } from '../lib/supabase';
import { BarcodeTemplate, BarcodeSetting, PrintLog } from '../types/barcode';
import { TradeIn } from '../types/tradeIn';
import { toast } from 'react-hot-toast';
import { printService } from './printService';

export const barcodeService = {
  // Fetch all barcode templates
  fetchTemplates: async (): Promise<BarcodeTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching barcode templates:', err);
      toast.error('Failed to fetch barcode templates');
      return [];
    }
  },

  // Fetch a specific template by ID
  fetchTemplateById: async (id: string): Promise<BarcodeTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching template:', err);
      toast.error('Failed to fetch template');
      return null;
    }
  },

  // Fetch the default template
  fetchDefaultTemplate: async (): Promise<BarcodeTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('barcode_templates')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching default template:', err);
      toast.error('Failed to fetch default template');
      return null;
    }
  },

  // Create a new template
  createTemplate: async (template: Omit<BarcodeTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<BarcodeTemplate | null> => {
    try {
      // If this is the default template, unset any existing defaults
      if (template.is_default) {
        await supabase
          .from('barcode_templates')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('barcode_templates')
        .insert({
          ...template,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Template created successfully');
      return data;
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error(`Failed to create template: ${(err as Error).message}`);
      return null;
    }
  },
  
  // Create a default card template if it doesn't exist
  createCardTemplate: async (): Promise<BarcodeTemplate | null> => {
    try {
      // Check if a card template already exists
      const { data: existingTemplates } = await supabase
        .from('barcode_templates')
        .select('id')
        .ilike('name', '%Card%')
        .limit(1);
        
      if (existingTemplates && existingTemplates.length > 0) {
        // Card template already exists
        return await barcodeService.fetchTemplateById(existingTemplates[0].id);
      }
      
      // Create a new card template with updated format and adjusted coordinates for 2" x 1" label
      // Now including SKU in the template
      const cardTemplate = {
        name: "Card Barcode Template",
        description: "Template for printing individual card barcodes with price, condition, name and number",
        zpl_template: `^XA
^FO20,30^A0N,70,70^FD\${{cardPrice}} | {{cardCondition}}^FS
^FO20,90^A0N,25,25^FDSKU: {{sku}}^FS
^FO50,140^BY3^BCN,50,Y,N,N^FD{{sku}}^FS
^FO20,180^A0N,30,30^FD{{cardName}} • {{setName}} • {{cardNumber}}^FS
^XZ`,
        is_default: false
      };
      
      return await barcodeService.createTemplate(cardTemplate);
    } catch (err) {
      console.error('Error creating card template:', err);
      toast.error(`Failed to create card template: ${(err as Error).message}`);
      return null;
    }
  },

  // Update an existing template
  updateTemplate: async (id: string, updates: Partial<BarcodeTemplate>): Promise<BarcodeTemplate | null> => {
    try {
      // If this is being set as default, unset any existing defaults
      if (updates.is_default) {
        await supabase
          .from('barcode_templates')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('barcode_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Template updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error(`Failed to update template: ${(err as Error).message}`);
      return null;
    }
  },

  // Delete a template
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      // Check if this is the default template
      const { data: template } = await supabase
        .from('barcode_templates')
        .select('is_default')
        .eq('id', id)
        .single();

      if (template?.is_default) {
        toast.error('Cannot delete the default template');
        return false;
      }

      const { error } = await supabase
        .from('barcode_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error(`Failed to delete template: ${(err as Error).message}`);
      return false;
    }
  },

  // Fetch barcode settings
  fetchSettings: async (): Promise<BarcodeSetting | null> => {
    try {
      const { data, error } = await supabase
        .from('barcode_settings')
        .select('*')
        .eq('setting_name', 'default_barcode_settings')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching barcode settings:', err);
      // Don't show error toast as this might be the first time fetching
      return null;
    }
  },

  // Update barcode settings
  updateSettings: async (settings: Partial<BarcodeSetting['setting_value']>): Promise<BarcodeSetting | null> => {
    try {
      // First get the current settings
      const { data: currentSettings } = await supabase
        .from('barcode_settings')
        .select('*')
        .eq('setting_name', 'default_barcode_settings')
        .single();

      // Merge new settings with existing settings
      const updatedValue = {
        ...(currentSettings?.setting_value || {}),
        ...settings
      };

      const { data, error } = await supabase
        .from('barcode_settings')
        .update({
          setting_value: updatedValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_name', 'default_barcode_settings')
        .select()
        .single();

      if (error) throw error;
      toast.success('Settings updated successfully');
      return data;
    } catch (err) {
      console.error('Error updating barcode settings:', err);
      toast.error(`Failed to update settings: ${(err as Error).message}`);
      return null;
    }
  },

  // Fetch print logs
  fetchPrintLogs: async (limit: number = 100): Promise<PrintLog[]> => {
    try {
      const { data, error } = await supabase
        .from('print_logs')
        .select(`
          *,
          trade_ins (
            id, 
            trade_in_date, 
            total_value,
            customers (first_name, last_name)
          )
        `)
        .order('printed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching print logs:', err);
      toast.error('Failed to fetch print logs');
      return [];
    }
  },

  // Updated method for downloading barcodes instead of printing
  downloadBarcodeWithTemplate: async (tradeIn: TradeIn, templateId: string | null = null, cardId: string | null = null, format: 'png' | 'pdf' | 'svg' = 'png'): Promise<void> => {
    try {
      const { downloadService } = await import('./downloadService');
      
      if (cardId) {
        // Find the card item
        const { data: cardItem, error } = await supabase
          .from('trade_in_items')
          .select('*')
          .eq('id', cardId)
          .eq('trade_in_id', tradeIn.id)
          .single();

        if (error || !cardItem) {
          throw new Error('Card not found');
        }

        await downloadService.downloadCardBarcode(tradeIn, cardItem, { format });
      } else {
        await downloadService.downloadTradeInBarcode(tradeIn, { format });
      }

      // Update trade-in record to track downloads
      const { error: updateError } = await supabase
        .from('trade_ins')
        .update({
          printed: true, // Keep this field for compatibility
          print_count: tradeIn.print_count ? tradeIn.print_count + 1 : 1,
          last_printed_at: new Date().toISOString(),
          printed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', tradeIn.id);
      
      if (updateError) {
        console.error('Error updating trade-in record:', updateError);
      }

      toast.success(cardId ? 'Card barcode downloaded successfully' : 'Barcode downloaded successfully');
    } catch (err) {
      console.error('Error downloading barcode:', err);
      toast.error(`Failed to download barcode: ${(err as Error).message}`);
      throw err;
    }
  },

  // Download a card barcode
  downloadCardBarcode: async (tradeIn: TradeIn, cardId: string, format: 'png' | 'pdf' = 'png'): Promise<void> => {
    try {
      await barcodeService.downloadBarcodeWithTemplate(tradeIn, null, cardId, format);
    } catch (err) {
      console.error('Error downloading card barcode:', err);
      throw err;
    }
  },

  // Batch download barcodes
  downloadBatchBarcodes: async (tradeIns: TradeIn[], format: 'png' | 'pdf' = 'pdf'): Promise<void> => {
    try {
      const { downloadService } = await import('./downloadService');
      await downloadService.downloadBatch(tradeIns, { format, layout: 'sheet' });
    } catch (err) {
      console.error('Error downloading batch barcodes:', err);
      toast.error(`Failed to download batch: ${(err as Error).message}`);
      throw err;
    }
  },

  // Legacy method compatibility - now downloads instead of prints
  printBarcodeWithTemplate: async (tradeIn: TradeIn, printerId: string, templateId: string | null = null, cardId: string | null = null): Promise<void> => {
    console.warn('printBarcodeWithTemplate is deprecated, use downloadBarcodeWithTemplate instead');
    return barcodeService.downloadBarcodeWithTemplate(tradeIn, templateId, cardId);
  },

  // Legacy method compatibility
  printCardBarcode: async (tradeIn: TradeIn, cardId: string, printerId: string): Promise<void> => {
    console.warn('printCardBarcode is deprecated, use downloadCardBarcode instead');
    return barcodeService.downloadCardBarcode(tradeIn, cardId);
  },

  // Test download method
  testDownload: async (mockTradeIn: TradeIn, format: 'png' | 'pdf' | 'svg' = 'png', cardId?: string): Promise<void> => {
    try {
      const { downloadService } = await import('./downloadService');
      
      if (cardId) {
        // Create mock card item for testing
        const mockCardItem = {
          id: cardId,
          card_id: 'test-card',
          card_name: 'Test Card',
          quantity: 1,
          price: 10.00,
          condition: 'near_mint' as const,
          attributes: {
            setName: 'Test Set',
            cardNumber: '1/100',
            isFirstEdition: false,
            isHolo: true
          },
          tcgplayer_url: 'https://www.tcgplayer.com/product/123/test',
          image_url: '',
          trade_in_id: mockTradeIn.id
        };
        
        await downloadService.downloadCardBarcode(mockTradeIn, mockCardItem, { format: format === 'svg' ? 'png' : format });
      } else {
        await downloadService.downloadTradeInBarcode(mockTradeIn, { format });
      }
      
      toast.success('Test download completed successfully');
    } catch (err) {
      console.error('Error in test download:', err);
      toast.error(`Test download failed: ${(err as Error).message}`);
      throw err;
    }
  },

  // Helper to render ZPL template with values (kept for compatibility)
  renderTemplate: (template: string, values: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] !== undefined ? String(values[key]) : '';
    });
  }
};
