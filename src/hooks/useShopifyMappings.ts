
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ShopifyMapping {
  id: string;
  source_field: string;
  target_field: string;
  transform_template: string | null;
  is_active: boolean;
  description: string | null;
  mapping_type: 'product' | 'variant' | 'metadata';
  sort_order: number;
}

export const useShopifyMappings = () => {
  const [mappings, setMappings] = useState<ShopifyMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('shopify_field_mappings')
        .select('*')
        .eq('is_active', true)
        .order('mapping_type')
        .order('sort_order');
      
      if (error) throw error;
      
      setMappings(data || []);
    } catch (err) {
      console.error('Error fetching Shopify mappings:', err);
      setError((err as Error).message || 'Failed to load Shopify mappings');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply template to data
  const applyTemplate = (template: string | null, data: Record<string, any>): string => {
    if (!template) return '';
    
    return template.replace(/{([^}]+)}/g, (_match, key) => {
      const [fieldName, defaultValue] = key.split('|');
      const value = data[fieldName.trim()];
      return (value !== undefined && value !== null) ? String(value) : (defaultValue || '');
    });
  };

  // Transform data using mappings
  const transformData = (
    data: Record<string, any>, 
    type: 'product' | 'variant' | 'metadata' = 'product'
  ): Record<string, any> => {
    const result: Record<string, any> = {};
    const typeMappings = mappings.filter(m => m.mapping_type === type);
    
    for (const mapping of typeMappings) {
      // Skip inactive mappings
      if (!mapping.is_active) continue;
      
      let value;
      
      // If there's a transform template, use it
      if (mapping.transform_template) {
        value = applyTemplate(mapping.transform_template, data);
      } else {
        // Direct mapping
        value = data[mapping.source_field];
      }
      
      // Handle nested properties (e.g., "variant.option1")
      if (mapping.target_field.includes('.')) {
        const [parent, child] = mapping.target_field.split('.');
        if (!result[parent]) result[parent] = {};
        result[parent][child] = value;
      } else {
        result[mapping.target_field] = value;
      }
    }
    
    return result;
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  return {
    mappings,
    isLoading,
    error,
    transformData,
    refreshMappings: fetchMappings
  };
};
