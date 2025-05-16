
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from '../../hooks/useSession';
import { Shield, AlertCircle, TestTube } from 'lucide-react';

interface ShopifySettings {
  shop_domain: string;
  access_token: string;
  api_key: string;
  api_secret: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  shop?: string;
  domain?: string;
  plan?: string;
  error?: string;
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
  const [isTesting, setIsTesting] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [permission, setPermission] = useState<{canView: boolean, canEdit: boolean}>({
    canView: false,
    canEdit: false
  });

  // Check user permissions based on role
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || '';
      const canView = ['admin', 'manager', 'shopify_manager'].includes(role);
      const canEdit = ['admin', 'manager'].includes(role);
      
      setPermission({ canView, canEdit });
      
      if (!canView) {
        setError('You do not have permission to view these settings');
      }
    }
  }, [user]);

  // Fetch existing settings if available
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !permission.canView) return;
      
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
  }, [user, permission.canView]);

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
    
    if (!permission.canEdit) {
      toast.error('You do not have permission to edit these settings');
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

  const handleTestConnection = async () => {
    if (!user) {
      toast.error('You must be logged in to test the connection');
      return;
    }
    
    setIsTesting(true);
    setError(null);
    setTestResult(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      // Call the test edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_test_connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ test: true }) // Just sending something simple
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }
      
      setTestResult(result);
      
      if (result.success) {
        toast.success('Shopify connection test successful!');
      } else {
        toast.error(`Connection test failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Test connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
      setTestResult({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsTesting(false);
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

  if (!permission.canView) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
        <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-yellow-700">Access Restricted</h2>
        <p className="text-yellow-600 mt-2">
          You don't have permission to view Shopify settings. 
          Please contact an administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
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
            readOnly={!permission.canEdit}
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
            readOnly={!permission.canEdit}
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
            readOnly={!permission.canEdit}
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
            readOnly={!permission.canEdit}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {permission.canEdit && (
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (hasExistingSettings ? 'Update Settings' : 'Save Settings')}
            </button>
          )}
          
          {hasExistingSettings && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <TestTube className="h-5 w-5 mr-2" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          )}
        </div>
      </form>
      
      {testResult && (
        <div className={`mt-6 p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <h3 className="font-medium text-lg">
            {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
          </h3>
          
          {testResult.success ? (
            <div className="mt-2">
              <p><strong>Shop Name:</strong> {testResult.shop}</p>
              <p><strong>Domain:</strong> {testResult.domain}</p>
              <p><strong>Plan:</strong> {testResult.plan}</p>
              <p className="text-green-700 mt-2">Your Shopify API credentials are working correctly.</p>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-red-700">{testResult.error}</p>
              <div className="mt-3 text-sm">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Verify your shop domain is correct (e.g., your-store.myshopify.com)</li>
                  <li>Check that your access token is valid and has not expired</li>
                  <li>Ensure your access token has the necessary permissions</li>
                  <li>Try regenerating a new access token in your Shopify admin</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      
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
