
import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface ShopifySettings {
  id?: string;
  shop_domain: string;
  api_key: string;
  api_secret: string;
  access_token: string;
  storefront_access_token?: string;
  is_active: boolean;
}

const ShopifySettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<ShopifySettings>({
    shop_domain: '',
    api_key: '',
    api_secret: '',
    access_token: '',
    storefront_access_token: '',
    is_active: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({ 
          ...data, 
          storefront_access_token: data.storefront_access_token || undefined,
          is_active: data.is_active ?? true 
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load Shopify settings');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, deactivate any existing active settings
      await supabase
        .from('shopify_settings')
        .update({ is_active: false })
        .eq('is_active', true);

      // Then create/update the new settings
      const { error } = settings.id
        ? await supabase
            .from('shopify_settings')
            .update({
              shop_domain: settings.shop_domain,
              api_key: settings.api_key,
              api_secret: settings.api_secret,
              access_token: settings.access_token,
              storefront_access_token: settings.storefront_access_token,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', settings.id)
        : await supabase
            .from('shopify_settings')
            .insert([{
              shop_domain: settings.shop_domain,
              api_key: settings.api_key,
              api_secret: settings.api_secret,
              access_token: settings.access_token,
              storefront_access_token: settings.storefront_access_token,
              is_active: true,
            }]);

      if (error) throw error;

      toast.success('Shopify settings saved successfully');
      setTestResult(null); // Reset test result when settings change
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save Shopify settings');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('shopify_test_connection');

      if (error) throw error;

      if (data.success) {
        setTestResult({ success: true, message: `Connected successfully to ${data.shop.name}` });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection test failed' });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Shopify API Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure your Shopify store connection. You can find these credentials in your Shopify Partner Dashboard or store admin.
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="shop_domain" className="text-sm font-medium text-gray-700">Shop Domain</label>
            <input
              id="shop_domain"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="your-store.myshopify.com"
              value={settings.shop_domain}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, shop_domain: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="api_key" className="text-sm font-medium text-gray-700">API Key</label>
            <input
              id="api_key"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Your Shopify API Key"
              value={settings.api_key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, api_key: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="api_secret" className="text-sm font-medium text-gray-700">API Secret</label>
            <input
              id="api_secret"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Your Shopify API Secret"
              value={settings.api_secret}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, api_secret: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="access_token" className="text-sm font-medium text-gray-700">Access Token</label>
            <input
              id="access_token"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Your Shopify Access Token"
              value={settings.access_token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, access_token: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="storefront_access_token" className="text-sm font-medium text-gray-700">Storefront Access Token (Optional)</label>
            <input
              id="storefront_access_token"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Your Shopify Storefront Access Token"
              value={settings.storefront_access_token || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, storefront_access_token: e.target.value })}
            />
          </div>

          {testResult && (
            <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`ml-2 text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Save Settings
            </button>
            
            <button 
              type="button" 
              onClick={testConnection}
              disabled={testing || !settings.shop_domain || !settings.access_token}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {testing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>}
              Test Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopifySettingsForm;
