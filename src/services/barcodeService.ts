
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
      
      // Create a new card template
      const cardTemplate = {
        name: "Card Barcode Template",
        description: "Template for printing individual card barcodes with price, condition, name and number",
        zpl_template: `^XA
^FO50,50^A0N,30,30^FD${{cardPrice}} | {{cardCondition}}^FS
^FO50,90^BY3^BCN,100,Y,N,N^FD{{tradeInId}}^FS
^FO50,220^A0N,30,30^FD{{cardName}}^FS
^FO50,260^A0N,20,20^FD{{cardNumber}}^FS
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

  // Print a barcode with a specific template
  printBarcodeWithTemplate: async (tradeIn: TradeIn, printerId: string, templateId: string | null = null, cardId: string | null = null): Promise<void> => {
    try {
      // Use the printService to handle actual printing
      await printService.printTradeInBarcode(tradeIn, printerId, templateId, cardId);
      
      // Record in print logs table
      await supabase
        .from('print_logs')
        .insert({
          trade_in_id: tradeIn.id,
          printer_id: printerId,
          template_id: templateId,
          printed_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'sent'
        });

      toast.success(cardId ? 'Card barcode sent to printer' : 'Barcode sent to printer');
    } catch (err) {
      console.error('Error printing barcode:', err);
      
      // Log the error
      await supabase
        .from('print_logs')
        .insert({
          trade_in_id: tradeIn.id,
          printer_id: printerId,
          template_id: templateId,
          printed_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'error',
          error_message: (err as Error).message
        });

      toast.error(`Failed to print barcode: ${(err as Error).message}`);
      throw err;
    }
  },

  // Print a card barcode
  printCardBarcode: async (tradeIn: TradeIn, cardId: string, printerId: string): Promise<void> => {
    try {
      // Get or create a card template
      const cardTemplate = await barcodeService.createCardTemplate();
      
      // Print using the card template
      await barcodeService.printBarcodeWithTemplate(tradeIn, printerId, cardTemplate?.id || null, cardId);
    } catch (err) {
      console.error('Error printing card barcode:', err);
      throw err;
    }
  },

  // Helper to render ZPL template with values
  renderTemplate: (template: string, values: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] !== undefined ? String(values[key]) : '';
    });
  }
};
