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
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching mappings:', error);
        setError(error.message);
      } else {
        setMappings(data || []);
      }
    } catch (err) {
      console.error('Error fetching mappings:', err);
      setError('Failed to fetch mappings');
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadComplete && user) {
      // Load default mappings if no mappings exist
      const loadDefaultMappings = async () => {
        setIsLoading(true);
        try {
          const { data: existingMappings, error: existingError } = await supabase
            .from('shopify_field_mappings')
            .select('*');

          if (existingError) {
            console.error('Error checking existing mappings:', existingError);
            setError(existingError.message);
            return;
          }

          if (!existingMappings || existingMappings.length === 0) {
            // Load default mappings from JSON file
            const defaultMappings = [
              {
                source_field: 'card_name',
                target_field: 'title',
                transform_template: null,
                is_active: true,
                description: 'Card Name to Product Title',
                mapping_type: 'product',
                sort_order: 1,
              },
              {
                source_field: 'condition',
                target_field: 'variant_title',
                transform_template: null,
                is_active: true,
                description: 'Card Condition to Variant Title',
                mapping_type: 'variant',
                sort_order: 2,
              },
              {
                source_field: 'price',
                target_field: 'price',
                transform_template: null,
                is_active: true,
                description: 'Card Price to Product Price',
                mapping_type: 'variant',
                sort_order: 3,
              },
              {
                source_field: 'trade_in_id',
                target_field: 'trade_in_id',
                transform_template: null,
                is_active: true,
                description: 'Trade-in ID to Product Metafield',
                mapping_type: 'metadata',
                sort_order: 4,
              },
              {
                source_field: 'customer_name',
                target_field: 'customer_name',
                transform_template: null,
                is_active: true,
                description: 'Customer Name to Product Metafield',
                mapping_type: 'metadata',
                sort_order: 5,
              },
            ];

            // Insert default mappings into the database
            const { error: insertError } = await supabase
              .from('shopify_field_mappings')
              .insert(defaultMappings);

            if (insertError) {
              console.error('Error inserting default mappings:', insertError);
              setError(insertError.message);
            } else {
              toast.success('Default mappings loaded successfully!');
              fetchMappings(); // Refresh mappings after loading defaults
            }
          }
        } catch (err) {
          console.error('Error loading default mappings:', err);
          setError('Failed to load default mappings');
        } finally {
          setIsLoading(false);
        }
      };

      loadDefaultMappings();
    }
  }, [initialLoadComplete, user, fetchMappings]);

  const handleAddMapping = () => {
    const newMapping: ShopifyFieldMapping = {
      source_field: '',
      target_field: '',
      transform_template: null,
      is_active: true,
      description: null,
      mapping_type: 'product',
      sort_order: mappings.length + 1,
    };
    setMappings([...mappings, newMapping]);
  };

  const handleDeleteMapping = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this mapping?')) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('shopify_field_mappings')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting mapping:', error);
          toast.error(`Failed to delete mapping: ${error.message}`);
        } else {
          toast.success('Mapping deleted successfully!');
          fetchMappings(); // Refresh mappings after deletion
        }
      } catch (err) {
        console.error('Error deleting mapping:', err);
        toast.error('Failed to delete mapping');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateMapping = async (id: string, field: string, value: string | boolean | null) => {
    setMappings(prevMappings =>
      prevMappings.map(mapping =>
        mapping.id === id ? { ...mapping, [field]: value } : mapping
      )
    );
  };

  const handleToggleActive = async (id: string) => {
    const mapping = mappings.find(m => m.id === id);
    if (!mapping) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shopify_field_mappings')
        .update({ is_active: !mapping.is_active })
        .eq('id', id);

      if (error) {
        console.error('Error toggling active status:', error);
        toast.error(`Failed to toggle active status: ${error.message}`);
      } else {
        toast.success('Mapping status updated successfully!');
        fetchMappings(); // Refresh mappings after status change
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
      toast.error('Failed to toggle active status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      for (const mapping of mappings) {
        if (mapping.id) {
          const { error } = await supabase
            .from('shopify_field_mappings')
            .update(mapping)
            .eq('id', mapping.id);

          if (error) {
            console.error('Error updating mapping:', error);
            toast.error(`Failed to update mapping: ${error.message}`);
            setIsLoading(false);
            return;
          }
        } else {
          const { error } = await supabase
            .from('shopify_field_mappings')
            .insert(mapping);

          if (error) {
            console.error('Error inserting mapping:', error);
            toast.error(`Failed to insert mapping: ${error.message}`);
            setIsLoading(false);
            return;
          }
        }
      }
      toast.success('All mappings saved successfully!');
      fetchMappings(); // Refresh mappings after saving
    } catch (err) {
      console.error('Error saving mappings:', err);
      toast.error('Failed to save mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupedMappings = () => {
    const grouped: { [key: string]: ShopifyFieldMapping[] } = {
      product: [],
      variant: [],
      metadata: [],
    };

    mappings.forEach(mapping => {
      grouped[mapping.mapping_type].push(mapping);
    });

    return grouped;
  };

  const groupedMappings = getGroupedMappings();

  if (isLoading) {
    return <div className="text-center">Loading mappings...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  const renderMappingSection = (type: 'product' | 'variant' | 'metadata', title: string) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Source Field
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Target Field
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Transform Template
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Active
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedMappings[type].map(mapping => (
              <tr key={mapping.id || mappings.indexOf(mapping)}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <input
                    type="text"
                    value={mapping.source_field}
                    onChange={e => handleUpdateMapping(mapping.id || '', 'source_field', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <input
                    type="text"
                    value={mapping.target_field}
                    onChange={e => handleUpdateMapping(mapping.id || '', 'target_field', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <input
                    type="text"
                    value={mapping.transform_template || ''}
                    onChange={e => handleUpdateMapping(mapping.id || '', 'transform_template', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <input
                    type="text"
                    value={mapping.description || ''}
                    onChange={e => handleUpdateMapping(mapping.id || '', 'description', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <button
                    onClick={() => handleToggleActive(mapping.id || '')}
                    className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Use setting</span>
                    <span
                      aria-hidden="true"
                      className={`${mapping.is_active ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                    <span
                      aria-hidden="true"
                      className={`${mapping.is_active ? 'bg-blue-600' : 'bg-gray-200'} absolute h-full w-full rounded-md transition ease-in-out duration-200`}
                    />
                  </button>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteMapping(mapping.id || '')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
              <li><code>{'{rarity}'}</code> - Card rarity</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Trade-In Fields</h4>
            <ul className="text-sm text-blue-700">
              <li><code>{'{trade_in_id}'}</code> - Trade-in ID</li>
              <li><code>{'{customer_name}'}</code> - Customer name</li>
              <li><code>{'{trade_date}'}</code> - Date of trade-in</li>
              <li><code>{'{price}'}</code> - Price paid for the card</li>
              <li><code>{'{quantity}'}</code> - Quantity of cards</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Helper Functions</h4>
            <ul className="text-sm text-blue-700">
              <li><code>{'{lowercase(value)}'}</code> - Convert to lowercase</li>
              <li><code>{'{uppercase(value)}'}</code> - Convert to uppercase</li>
              <li><code>{'{capitalize(value)}'}</code> - Capitalize first letter</li>
              <li><code>{'{trim(value)}'}</code> - Remove whitespace</li>
              <li><code>{'{date_format(value, format)}'}</code> - Format date</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyMappingsEditor;
