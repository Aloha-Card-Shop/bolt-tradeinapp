
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
    
    return template.replace(/{([^}]+)}/g, (match, expr) => {
      // Handle expressions with methods like {condition.charAt(0)}
      if (expr.includes('.')) {
        const parts = expr.split('.');
        const fieldName = parts[0].trim();
        const methodPart = parts.slice(1).join('.').trim();
        
        // Get the base value
        let value = data[fieldName];
        if (value === undefined || value === null) {
          // Check if there's a default value provided
          const defaultMatch = expr.match(/\|(.+)$/);
          return defaultMatch ? defaultMatch[1].trim() : '';
        }
        
        // Convert value to string if it's not already
        if (typeof value !== 'string') {
          value = String(value);
        }
        
        // Support for string methods
        if (methodPart.startsWith('charAt(') && methodPart.endsWith(')')) {
          const index = parseInt(methodPart.substring(7, methodPart.length - 1), 10);
          return value.charAt(index);
        }
        
        if (methodPart.startsWith('substring(') && methodPart.endsWith(')')) {
          const args = methodPart.substring(10, methodPart.length - 1).split(',').map(arg => parseInt(arg.trim(), 10));
          return value.substring(args[0], args[1]);
        }
        
        if (methodPart === 'toUpperCase()') {
          return value.toUpperCase();
        }
        
        if (methodPart === 'toLowerCase()') {
          return value.toLowerCase();
        }
        
        // New: Support for replace method
        if (methodPart.startsWith('replace(') && methodPart.endsWith(')')) {
          const argsStr = methodPart.substring(8, methodPart.length - 1);
          // Split by comma but not inside quotes
          const args = argsStr.match(/('[^']*'|"[^"]*"|[^,]+)/g);
          if (args && args.length === 2) {
            const search = args[0].trim().replace(/^['"]|['"]$/g, '');  // Remove quotes
            const replacement = args[1].trim().replace(/^['"]|['"]$/g, '');  // Remove quotes
            return value.replace(new RegExp(search, 'g'), replacement);
          }
        }
        
        // If method not recognized, return the original value
        return value;
      }
      
      const [fieldName, defaultValue] = expr.split('|');
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
