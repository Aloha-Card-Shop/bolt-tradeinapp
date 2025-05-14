
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from '../../hooks/useSession';

interface ShopifySettings {
  shop_domain: string;
  access_token: string;
  api_key: string;
  api_secret: string;
}

const ShopifySettingsForm: React.FC = () => {
  const { user } = useSession();
  const [settings, setSettings] = useState<ShopifySettings>({
    shop_domain: '',
    access_token: '',
    api_key: '',
    api_secret: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing settings if available
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('shopify_settings')
          .select('*')
          .limit(1)
          .single();
          
        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            console.error('Error fetching Shopify settings:', error);
            setError('Failed to load Shopify settings');
            toast.error('Failed to load Shopify settings');
          }
          return;
        }
        
        if (data) {
          setSettings({
            shop_domain: data.shop_domain || '',
            access_token: data.access_token || '',
            api_key: data.api_key || '',
            api_secret: data.api_secret || ''
          });
          setHasExistingSettings(true);
          toast.success('Shopify settings loaded successfully');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while fetching settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to save settings');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { shop_domain, access_token, api_key, api_secret } = settings;
      
      if (!shop_domain || !access_token) {
        toast.error('Shop domain and access token are required');
        return;
      }
      
      const payload = {
        shop_domain,
        access_token,
        api_key,
        api_secret,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      
      let response;
      
      if (hasExistingSettings) {
        // Update existing settings
        response = await supabase
          .from('shopify_settings')
          .update(payload)
          .is('id', 'not.null');
      } else {
        // Insert new settings
        response = await supabase
          .from('shopify_settings')
          .insert(payload);
      }
      
      if (response.error) {
        console.error('Error saving settings:', response.error);
        setError(response.error.message);
        toast.error(`Failed to save settings: ${response.error.message}`);
        return;
      }
      
      toast.success('Shopify settings saved successfully');
      setHasExistingSettings(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Shopify API Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop Domain (without https://)
          </label>
          <input
            type="text"
            name="shop_domain"
            placeholder="your-store.myshopify.com"
            value={settings.shop_domain}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Token
          </label>
          <input
            type="password"
            name="access_token"
            placeholder="shpat_..."
            value={settings.access_token}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key (optional)
          </label>
          <input
            type="text"
            name="api_key"
            value={settings.api_key}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Secret (optional)
          </label>
          <input
            type="password"
            name="api_secret"
            value={settings.api_secret}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (hasExistingSettings ? 'Update Settings' : 'Save Settings')}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>To get your Shopify API credentials:</p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Go to your Shopify admin panel</li>
          <li>Navigate to Apps → App and Sales Channel Settings</li>
          <li>Click "Develop apps for your store" at the bottom</li>
          <li>Create a new app or select an existing one</li>
          <li>Generate API credentials with appropriate access scopes</li>
        </ol>
      </div>
    </div>
  );
};

export default ShopifySettingsForm;
