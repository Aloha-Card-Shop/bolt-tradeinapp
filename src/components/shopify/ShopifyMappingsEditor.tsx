import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Save, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

interface ShopifyFieldMapping {
  id?: string;
  source_field: string;
  target_field: string;
  transform_template: string | null;
  is_active: boolean;
  description: string | null;
  mapping_type: 'product' | 'variant' | 'metadata';
  sort_order: number;
}

const ShopifyMappingsEditor: React.FC = () => {
  const [mappings, setMappings] = useState<ShopifyFieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { user } = useSession();

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('shopify_field_mappings')
        .select('*')
        .order('mapping_type', { ascending: true })
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      setMappings(data || []);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to load mappings';
      console.error('Error fetching mappings:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);
  
  // Add default mappings if needed (separate effect to avoid render loops)
  useEffect(() => {
    // Only run after initial data load and when not loading
    if (!initialLoadComplete || isLoading) return;
    
    const defaultMappings: ShopifyFieldMapping[] = [];
    
    // Check for card_type mapping
    const hasCardTypeMapping = mappings.some(m => 
      m.mapping_type === 'variant' && m.source_field === 'card_type'
    );
    
    if (!hasCardTypeMapping) {
      defaultMappings.push({
        source_field: 'card_type',
        target_field: 'option2',
        transform_template: null,
        is_active: true,
        description: 'Card type/edition',
        mapping_type: 'variant' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'variant').length + 1
      });
    }
    
    // Check for cost mapping
    const hasCostMapping = mappings.some(m => 
      m.mapping_type === 'variant' && m.source_field === 'cost'
    );
    
    if (!hasCostMapping) {
      defaultMappings.push({
        source_field: 'cost',
        target_field: 'cost',
        transform_template: '{paymentType === "cash" ? cashValue : tradeValue}',
        is_active: true,
        description: 'Trade-in cost (cash/trade value given)',
        mapping_type: 'variant' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'variant').length + 1 + (!hasCardTypeMapping ? 1 : 0)
      });
    }
    
    // Check for product_type mapping
    const hasProductTypeMapping = mappings.some(m => 
      m.mapping_type === 'product' && m.target_field === 'product_type'
    );
    
    if (!hasProductTypeMapping) {
      defaultMappings.push({
        source_field: 'game_type',
        target_field: 'product_type',
        transform_template: '{game_type} Card',
        is_active: true,
        description: 'Product type (e.g. Pokemon Card, Magic Card)',
        mapping_type: 'product' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'product').length + 1
      });
    }
    
    // Check for tags mapping
    const hasTagsMapping = mappings.some(m => 
      m.mapping_type === 'product' && m.target_field === 'tags'
    );
    
    if (!hasTagsMapping) {
      defaultMappings.push({
        source_field: 'set_name',
        target_field: 'tags',
        transform_template: 'Trade-In,{game_type},{set_name},{condition}',
        is_active: true,
        description: 'Product tags for filtering and organization',
        mapping_type: 'product' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'product').length + 1 + (!hasProductTypeMapping ? 1 : 0)
      });
    }

    // Check for custom.set metafield mapping
    const hasSetMetafieldMapping = mappings.some(m => 
      m.mapping_type === 'metadata' && m.target_field === 'metafields[0].key' && m.transform_template === 'set'
    );
    
    if (!hasSetMetafieldMapping) {
      defaultMappings.push({
        source_field: 'set_name',
        target_field: 'metafields[0].key',
        transform_template: 'set',
        is_active: true,
        description: 'Metafield key for set name',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 1
      });
      
      defaultMappings.push({
        source_field: 'set_name',
        target_field: 'metafields[0].namespace',
        transform_template: 'custom',
        is_active: true,
        description: 'Metafield namespace for set name',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 2
      });
      
      defaultMappings.push({
        source_field: 'set_name',
        target_field: 'metafields[0].value_type',
        transform_template: 'string',
        is_active: true,
        description: 'Metafield value type for set name',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 3
      });
      
      defaultMappings.push({
        source_field: 'set_name',
        target_field: 'metafields[0].value',
        transform_template: '{set_name}',
        is_active: true,
        description: 'Metafield value for set name',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 4
      });
    }
    
    // Check for custom.rarity metafield mapping
    const hasRarityMetafieldMapping = mappings.some(m => 
      m.mapping_type === 'metadata' && m.target_field === 'metafields[1].key' && m.transform_template === 'rarity'
    );
    
    if (!hasRarityMetafieldMapping) {
      defaultMappings.push({
        source_field: 'rarity',
        target_field: 'metafields[1].key',
        transform_template: 'rarity',
        is_active: true,
        description: 'Metafield key for rarity',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 5 + (hasSetMetafieldMapping ? 0 : 4)
      });
      
      defaultMappings.push({
        source_field: 'rarity',
        target_field: 'metafields[1].namespace',
        transform_template: 'custom',
        is_active: true,
        description: 'Metafield namespace for rarity',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 6 + (hasSetMetafieldMapping ? 0 : 4)
      });
      
      defaultMappings.push({
        source_field: 'rarity',
        target_field: 'metafields[1].value_type',
        transform_template: 'string',
        is_active: true,
        description: 'Metafield value type for rarity',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 7 + (hasSetMetafieldMapping ? 0 : 4)
      });
      
      defaultMappings.push({
        source_field: 'rarity',
        target_field: 'metafields[1].value',
        transform_template: '{rarity}',
        is_active: true,
        description: 'Metafield value for rarity',
        mapping_type: 'metadata' as const,
        sort_order: mappings.filter(m => m.mapping_type === 'metadata').length + 8 + (hasSetMetafieldMapping ? 0 : 4)
      });
    }
    
    // Add all default mappings at once if any
    if (defaultMappings.length > 0) {
      setMappings(prev => [...prev, ...defaultMappings]);
    }
  }, [initialLoadComplete, isLoading, mappings]);

  const handleAddMapping = () => {
    const newMapping: ShopifyFieldMapping = {
      source_field: '',
      target_field: '',
      transform_template: '',
      is_active: true,
      description: '',
      mapping_type: 'product',
      sort_order: mappings.length + 1
    };
    
    setMappings([...mappings, newMapping]);
  };

  const handleDeleteMapping = async (index: number) => {
    const mapping = mappings[index];
    
    // If this is an existing mapping (has an ID), delete it from the database
    if (mapping.id) {
      try {
        const { error } = await supabase
          .from('shopify_field_mappings')
          .delete()
          .eq('id', mapping.id);
        
        if (error) throw error;
        
        toast.success('Mapping deleted successfully');
      } catch (err) {
        const errorMessage = (err as Error).message || 'Failed to delete mapping';
        console.error('Error deleting mapping:', err);
        toast.error(errorMessage);
        return;
      }
    }
    
    // Remove from local state
    const updatedMappings = [...mappings];
    updatedMappings.splice(index, 1);
    setMappings(updatedMappings);
  };

  const handleUpdateMapping = (index: number, field: keyof ShopifyFieldMapping, value: any) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      [field]: value
    };
    setMappings(updatedMappings);
  };

  const handleToggleActive = (index: number) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      is_active: !updatedMappings[index].is_active
    };
    setMappings(updatedMappings);
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast.error('You must be logged in to save mappings');
      return;
    }

    // Validate mappings before saving
    const invalidMappings = mappings.filter(m => 
      !m.source_field || !m.target_field || !m.mapping_type
    );

    if (invalidMappings.length > 0) {
      toast.error('Please fill in all required fields (source, target, and type)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Process each mapping
      for (const mapping of mappings) {
        if (mapping.id) {
          // Update existing mapping
          const { error } = await supabase
            .from('shopify_field_mappings')
            .update({
              source_field: mapping.source_field,
              target_field: mapping.target_field,
              transform_template: mapping.transform_template,
              is_active: mapping.is_active,
              description: mapping.description,
              mapping_type: mapping.mapping_type,
              sort_order: mapping.sort_order,
              updated_at: new Date().toISOString()
            })
            .eq('id', mapping.id);
          
          if (error) throw error;
        } else {
          // Insert new mapping
          const { error } = await supabase
            .from('shopify_field_mappings')
            .insert({
              source_field: mapping.source_field,
              target_field: mapping.target_field,
              transform_template: mapping.transform_template,
              is_active: mapping.is_active,
              description: mapping.description,
              mapping_type: mapping.mapping_type,
              sort_order: mapping.sort_order,
              created_by: user.id
            });
          
          if (error) throw error;
        }
      }
      
      toast.success('Mappings saved successfully');
      fetchMappings(); // Refresh data
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to save mappings';
      console.error('Error saving mappings:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupedMappings = () => {
    const grouped: Record<string, ShopifyFieldMapping[]> = {
      product: [],
      variant: [],
      metadata: []
    };

    mappings.forEach(mapping => {
      if (mapping.mapping_type in grouped) {
        grouped[mapping.mapping_type].push(mapping);
      } else {
        grouped.product.push(mapping);
      }
    });

    return grouped;
  };

  const groupedMappings = getGroupedMappings();

  if (isLoading && mappings.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && mappings.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <h3 className="text-lg font-medium">Error loading mappings</h3>
        <p>{error}</p>
        <button 
          onClick={fetchMappings}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderMappingSection = (type: 'product' | 'variant' | 'metadata', title: string) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transform Template</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedMappings[type].map((mapping, idx) => {
              const mappingIndex = mappings.findIndex(m => 
                m.id ? m.id === mapping.id : m === mapping
              );
              
              return (
                <tr key={mapping.id || `new-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(mappingIndex)}
                      className="focus:outline-none"
                    >
                      {mapping.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={mapping.source_field}
                      onChange={(e) => handleUpdateMapping(mappingIndex, 'source_field', e.target.value)}
                      className="border border-gray-300 p-1 rounded w-full"
                      placeholder="e.g., card_name"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={mapping.target_field}
                      onChange={(e) => handleUpdateMapping(mappingIndex, 'target_field', e.target.value)}
                      className="border border-gray-300 p-1 rounded w-full"
                      placeholder="e.g., title"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={mapping.transform_template || ''}
                      onChange={(e) => handleUpdateMapping(mappingIndex, 'transform_template', e.target.value)}
                      className="border border-gray-300 p-1 rounded w-full"
                      placeholder="e.g., {card_name} - {condition}"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={mapping.description || ''}
                      onChange={(e) => handleUpdateMapping(mappingIndex, 'description', e.target.value)}
                      className="border border-gray-300 p-1 rounded w-full"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteMapping(mappingIndex)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          Configure how your trade-in data is mapped to Shopify fields when syncing to your store.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleAddMapping}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Mapping
          </button>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={isLoading}
          >
            <Save className="h-5 w-5 mr-2" />
            Save All
          </button>
        </div>
      </div>

      {renderMappingSection('product', 'Product Mappings')}
      {renderMappingSection('variant', 'Variant Mappings')}
      {renderMappingSection('metadata', 'Metadata Mappings')}

      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Template Variables</h3>
        <p className="text-blue-700 mb-2">
          Use curly braces to insert variables into your templates. For example: <code>{'{card_name}'}</code>
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-blue-800">Card Fields</h4>
            <ul className="text-sm text-blue-700">
              <li><code>{'{card_name}'}</code> - Name of the card</li>
              <li><code>{'{set_name}'}</code> - Card set name</li>
              <li><code>{'{card_number}'}</code> - Card number</li>
              <li><code>{'{condition}'}</code> - Card condition</li>
              <li><code>{'{price}'}</code> - Card market price</li>
              <li><code>{'{cost}'}</code> - Trade-in cost (cash/trade value given)</li>
              <li><code>{'{cashValue}'}</code> - Cash value given for the card</li>
              <li><code>{'{tradeValue}'}</code> - Trade value given for the card</li>
              <li><code>{'{quantity}'}</code> - Quantity</li>
              <li><code>{'{game_type}'}</code> - Card game type</li>
              <li><code>{'{is_first_edition}'}</code> - Is first edition (true/false)</li>
              <li><code>{'{is_holo}'}</code> - Is holo (true/false)</li>
              <li><code>{'{is_reverse_holo}'}</code> - Is reverse holo (true/false)</li>
              <li><code>{'{card_type}'}</code> - Card type description (1st Edition, Holo, etc.)</li>
              <li><code>{'{paymentType}'}</code> - Payment type for this card (cash/trade)</li>
              <li><code>{'{rarity}'}</code> - Card rarity</li>
              <li><code>{'{condition.charAt(0)}'}</code> - First character of condition (e.g., "N" for "Near Mint")</li>
              <li><code>{'{card_name.substring(0,10)}'}</code> - First 10 characters of card name</li>
              <li><code>{'{set_name.toUpperCase()}'}</code> - Set name in all caps</li>
              <li><code>{'{game_type.toLowerCase()}'}</code> - Game type in lowercase</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Trade-In Fields</h4>
            <ul className="text-sm text-blue-700">
              <li><code>{'{customer_name}'}</code> - Customer name</li>
              <li><code>{'{trade_in_date}'}</code> - Trade-in date</li>
              <li><code>{'{trade_in_id}'}</code> - Trade-in ID</li>
              <li><code>{'{payment_type}'}</code> - Payment type</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Tips</h4>
            <ul className="text-sm text-blue-700">
              <li>Leave template blank to use direct mapping</li>
              <li>HTML is allowed in <code>body_html</code> fields</li>
              <li>Use <code>{'{field_name|default}'}</code> for fallbacks</li>
              <li>Combine multiple fields in one template</li>
              <li>Use string methods like <code>{'{condition.charAt(0)}'}</code> to get first character</li>
              <li>Supported methods: <code>charAt()</code>, <code>substring()</code>, <code>toUpperCase()</code>, <code>toLowerCase()</code></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 bg-blue-100 p-3 rounded">
          <h4 className="font-medium text-blue-800 mb-1">String Methods Examples:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><code>{'{condition.charAt(0)}'}</code> - First character of condition (e.g., "N" for "Near Mint")</li>
            <li><code>{'{card_name.substring(0,10)}'}</code> - First 10 characters of card name</li>
            <li><code>{'{set_name.toUpperCase()}'}</code> - Set name in all caps</li>
            <li><code>{'{game_type.toLowerCase()}'}</code> - Game type in lowercase</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShopifyMappingsEditor;
