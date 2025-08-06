
import { supabase } from '../integrations/supabase/client';
import { BarcodeTemplate, BarcodeSetting, PrintLog } from '../types/barcode';
import { TradeIn } from '../types/tradeIn';
import { downloadService } from './downloadService';

export const barcodeService = {
  // Template management
  fetchTemplates: async (): Promise<BarcodeTemplate[]> => {
    const { data, error } = await supabase
      .from('barcode_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(template => ({
      ...template,
      description: template.description || undefined,
      is_default: template.is_default || false,
      created_by: template.created_by || undefined,
      updated_at: template.updated_at || undefined,
      created_at: template.created_at || undefined
    }));
  },

  fetchTemplateById: async (id: string): Promise<BarcodeTemplate | null> => {
    const { data, error } = await supabase
      .from('barcode_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data ? {
      ...data,
      description: data.description || undefined,
      is_default: data.is_default || false,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at || undefined,
      created_at: data.created_at || undefined
    } : null;
  },

  fetchDefaultTemplate: async (): Promise<BarcodeTemplate | null> => {
    const { data, error } = await supabase
      .from('barcode_templates')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data ? {
      ...data,
      description: data.description || undefined,
      is_default: data.is_default || false,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at || undefined,
      created_at: data.created_at || undefined
    } : null;
  },

  createTemplate: async (template: Omit<BarcodeTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<BarcodeTemplate> => {
    const { data, error } = await supabase
      .from('barcode_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      description: data.description || undefined,
      is_default: data.is_default || false,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at || undefined,
      created_at: data.created_at || undefined
    };
  },

  updateTemplate: async (id: string, updates: Partial<BarcodeTemplate>): Promise<BarcodeTemplate> => {
    const { data, error } = await supabase
      .from('barcode_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      description: data.description || undefined,
      is_default: data.is_default || false,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at || undefined,
      created_at: data.created_at || undefined
    };
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('barcode_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  setDefaultTemplate: async (id: string): Promise<void> => {
    // First, unset all other default templates
    await supabase
      .from('barcode_templates')
      .update({ is_default: false })
      .neq('id', id);
    
    // Then set the new default
    const { error } = await supabase
      .from('barcode_templates')
      .update({ is_default: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Settings management
  fetchSettings: async (): Promise<BarcodeSetting[]> => {
    const { data, error } = await supabase
      .from('barcode_settings')
      .select('*')
      .order('setting_name');
    
    if (error) throw error;
    return (data || []) as BarcodeSetting[];
  },

  fetchSettingByName: async (name: string): Promise<BarcodeSetting | null> => {
    const { data, error } = await supabase
      .from('barcode_settings')
      .select('*')
      .eq('setting_name', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data as BarcodeSetting;
  },

  updateSetting: async (name: string, value: any, description?: string): Promise<BarcodeSetting> => {
    const setting = {
      setting_name: name,
      setting_value: value,
      description,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('barcode_settings')
      .upsert(setting, { onConflict: 'setting_name' })
      .select()
      .single();
    
    if (error) throw error;
    return data as BarcodeSetting;
  },

  // Print logging
  createPrintLog: async (log: Omit<PrintLog, 'id' | 'printed_at'>): Promise<PrintLog> => {
    const { data, error } = await supabase
      .from('print_logs')
      .insert({
        ...log,
        printed_at: new Date().toISOString()
      })
      .select(`
        *,
        trade_in:trade_ins(*)
      `)
      .single();
    
    if (error) throw error;
    return {
      ...data,
      template_id: data.template_id || undefined,
      error_message: data.error_message || undefined,
      print_job_id: data.print_job_id || undefined,
      printed_at: data.printed_at || undefined
    } as PrintLog;
  },

  fetchPrintLogs: async (limit = 50): Promise<PrintLog[]> => {
    const { data, error } = await supabase
      .from('print_logs')
      .select(`
        *,
        trade_in:trade_ins(*)
      `)
      .order('printed_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []).map(log => ({
      ...log,
      template_id: log.template_id || undefined,
      error_message: log.error_message || undefined,
      print_job_id: log.print_job_id || undefined,
      printed_at: log.printed_at || undefined
    })) as PrintLog[];
  },

  fetchPrintLogsByTradeIn: async (tradeInId: string): Promise<PrintLog[]> => {
    const { data, error } = await supabase
      .from('print_logs')
      .select(`
        *,
        trade_in:trade_ins(*)
      `)
      .eq('trade_in_id', tradeInId)
      .order('printed_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(log => ({
      ...log,
      template_id: log.template_id || undefined,
      error_message: log.error_message || undefined,
      print_job_id: log.print_job_id || undefined,
      printed_at: log.printed_at || undefined
    })) as PrintLog[];
  },

  // Template rendering utility
  renderTemplate: (template: string, values: Record<string, any>): string => {
    let rendered = template;
    
    // Replace template variables with actual values
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });
    
    return rendered;
  },

  // Download barcode using the download service
  downloadBarcode: async (tradeIn: TradeIn, format: 'png' | 'pdf' | 'svg' = 'png') => {
    try {
      await downloadService.downloadTradeInBarcode(tradeIn, { format });
    } catch (error) {
      console.error('Error downloading barcode:', error);
      throw error;
    }
  },

  // Test download functionality
  testDownload: async (format: 'png' | 'pdf' | 'svg' = 'png') => {
    const mockTradeIn: TradeIn = {
      id: 'test-' + Date.now(),
      trade_in_date: new Date().toISOString(),
      total_value: 125.50,
      cash_value: 100.40,
      trade_value: 125.50,
      customer_name: 'Test Customer',
      customer_id: 'test-customer-id',
      status: 'accepted',
      printed: false,
      print_count: 0
    };

    try {
      await downloadService.downloadTradeInBarcode(mockTradeIn, { format });
    } catch (error) {
      console.error('Error testing download:', error);
      throw error;
    }
  }
};
