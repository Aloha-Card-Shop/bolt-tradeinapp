
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle, Eye, EyeOff, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string | null;
  last_updated: string;
  expiration_date: string | null;
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
    if (!dateString) return 'No expiration';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const calculateDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    
    const expirationDate = new Date(dateString);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
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

  const updateApiKey = async (id: string, keyValue: string, expirationDate: string | null) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          key_value: keyValue,
          expiration_date: expirationDate,
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

  const handleExpirationChange = (id: string, date: string) => {
    setApiKeys(prev =>
      prev.map(key =>
        key.id === id ? { ...key, expiration_date: date } : key
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
            const daysRemaining = key.expiration_date ? calculateDaysRemaining(key.expiration_date) : null;
            const isExpired = daysRemaining !== null && daysRemaining <= 0;
            const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 14;
            
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
                  
                  {key.expiration_date && (
                    <div className={`mt-2 sm:mt-0 flex items-center px-3 py-1 rounded-full text-sm ${
                      isExpired ? 'bg-red-100 text-red-800' : 
                      isExpiringSoon ? 'bg-amber-100 text-amber-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {isExpired ? 'Expired' : 
                       isExpiringSoon ? `Expires in ${daysRemaining} days` :
                       `Expires in ${daysRemaining} days`}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
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
                        onClick={() => updateApiKey(key.id, key.key_value, key.expiration_date)}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <div className="flex">
                      <input
                        type="date"
                        value={key.expiration_date ? key.expiration_date.substring(0, 10) : ''}
                        onChange={(e) => handleExpirationChange(key.id, e.target.value ? new Date(e.target.value).toISOString() : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Set a reminder for when this API key needs to be renewed
                    </p>
                  </div>
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
