
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useSession } from '../../hooks/useSession';

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string | null;
  last_updated: string;
  is_active: boolean;
}

const ApiKeySettings = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const { user } = useSession();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('key_name');
        
      if (error) throw error;
      
      setApiKeys(data || []);
      
      // Initialize showValues state
      const initialShowValues: Record<string, boolean> = {};
      data?.forEach(key => {
        initialShowValues[key.id] = false;
      });
      setShowValues(initialShowValues);
      
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const updateApiKey = async (id: string, keyValue: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          key_value: keyValue,
          last_updated: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('API key updated successfully');
      await fetchApiKeys();
      
    } catch (err) {
      console.error('Error updating API key:', err);
      setError('Failed to update API key');
      toast.error('Failed to update API key');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShowValue = (id: string) => {
    setShowValues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleKeyChange = (id: string, value: string) => {
    setApiKeys(prev =>
      prev.map(key =>
        key.id === id ? { ...key, key_value: value } : key
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {apiKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No API keys found. Please add keys to use external services.
        </div>
      ) : (
        <div className="space-y-8">
          {apiKeys.map(key => {
            return (
              <div 
                key={key.id} 
                className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{key.key_name}</h3>
                    {key.description && (
                      <p className="text-gray-600 mt-1">{key.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="flex">
                    <div className="relative flex-grow">
                      <input
                        type={showValues[key.id] ? 'text' : 'password'}
                        value={key.key_value}
                        onChange={(e) => handleKeyChange(key.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter API key..."
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowValue(key.id)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                      >
                        {showValues[key.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => updateApiKey(key.id, key.key_value)}
                      disabled={isSaving}
                      className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Last updated: {formatDate(key.last_updated)}
                  </p>
                </div>
                
                {key.key_name === 'PSA_API_TOKEN' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                    <p className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span>This key is used for PSA certificate lookups and submission tracking. Make sure it's up to date to avoid service disruptions.</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApiKeySettings;
