
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const EbayAccountDeletionTest: React.FC = () => {
  const [challengeCode, setChallengeCode] = useState('test123');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testChallengeValidation = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('Testing GET request with challenge code:', challengeCode);
      
      // For GET requests with query parameters, we need to use the direct endpoint
      const url = `https://qgsabaicokoynabxgdco.supabase.co/functions/v1/account-deletion?challenge_code=${encodeURIComponent(challengeCode)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Challenge test failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Challenge test response:', data);
      
      setTestResult({ 
        success: true, 
        data,
        type: 'challenge'
      });
      toast.success('Challenge validation test passed');
    } catch (err) {
      console.error('Challenge test exception:', err);
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'challenge'
      });
      toast.error('Challenge validation test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotificationHandling = async () => {
    setIsLoading(true);
    setTestResult(null);

    const testPayload = {
      metadata: {
        topic: 'MARKETPLACE_ACCOUNT_DELETION'
      },
      notification: {
        notificationId: 'test-notification-' + Date.now(),
        eventDate: new Date().toISOString(),
        data: {
          username: 'testuser123',
          userId: 'test-user-id-456',
          eiasToken: 'test-eias-token-789'
        }
      }
    };

    try {
      console.log('Testing POST request with payload:', testPayload);
      
      const { data, error } = await supabase.functions.invoke('account-deletion', {
        body: testPayload
      });

      if (error) {
        console.error('Notification test error:', error);
        setTestResult({ 
          success: false, 
          error: error.message || 'Unknown error',
          type: 'notification'
        });
        toast.error('Notification handling test failed');
      } else {
        console.log('Notification test response:', data);
        setTestResult({ 
          success: true, 
          data: data || 'Success (empty response)',
          type: 'notification'
        });
        toast.success('Notification handling test passed');
      }
    } catch (err) {
      console.error('Notification test exception:', err);
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'notification'
      });
      toast.error('Notification handling test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectPostEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);

    const testPayload = {
      metadata: {
        topic: 'MARKETPLACE_ACCOUNT_DELETION'
      },
      notification: {
        notificationId: 'test-notification-' + Date.now(),
        eventDate: new Date().toISOString(),
        data: {
          username: 'directtest123',
          userId: 'direct-test-id-456',
          eiasToken: 'direct-test-eias-789'
        }
      }
    };

    try {
      console.log('Testing direct POST request with payload:', testPayload);
      
      const response = await fetch('https://qgsabaicokoynabxgdco.supabase.co/functions/v1/account-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct POST test failed:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // eBay spec expects empty response body for successful POST
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : 'Success (empty response)';
      
      console.log('Direct POST test response:', data);
      
      setTestResult({ 
        success: true, 
        data,
        type: 'direct-post'
      });
      toast.success('Direct POST endpoint test passed');
    } catch (err) {
      console.error('Direct POST test exception:', err);
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'direct-post'
      });
      toast.error('Direct POST endpoint test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">eBay Account Deletion Function Test</h2>
      
      <div className="space-y-6">
        {/* Challenge Validation Test */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">GET Request - Challenge Validation</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={challengeCode}
              onChange={(e) => setChallengeCode(e.target.value)}
              placeholder="Challenge code"
              className="px-3 py-2 border rounded-md flex-1"
            />
            <button
              onClick={testChallengeValidation}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Challenge'}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Tests GET request with challenge_code query parameter (eBay compliance test)
          </p>
        </div>

        {/* Notification Handling Test via Supabase Client */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">POST Request - Notification Handling (Supabase Client)</h3>
          <button
            onClick={testNotificationHandling}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Notification'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Tests POST request with eBay account deletion notification payload via Supabase client
          </p>
        </div>

        {/* Direct POST Endpoint Test */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">POST Request - Direct Endpoint Test</h3>
          <button
            onClick={testDirectPostEndpoint}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Direct POST'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Tests POST request directly to the edge function endpoint (simulates eBay notification)
          </p>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Test Results</h3>
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.type === 'challenge' ? 'Challenge Validation' : 
                   testResult.type === 'notification' ? 'Notification Handling (Client)' : 
                   'Direct POST Test'}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {testResult.success ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              
              {testResult.success ? (
                <div className="text-sm text-green-700">
                  <strong>Response:</strong>
                  <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <strong>Error:</strong> {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Function Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Function Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Endpoint:</strong> https://qgsabaicokoynabxgdco.supabase.co/functions/v1/account-deletion</p>
            <p><strong>Secrets configured:</strong> EBAY_VERIFICATION_TOKEN, PUBLIC_ENDPOINT_URL</p>
            <p><strong>Methods supported:</strong> GET (challenge), POST (notification), OPTIONS (CORS)</p>
            <p><strong>Challenge format:</strong> GET ?challenge_code=value</p>
            <p><strong>Expected response:</strong> JSON with challengeResponse field</p>
            <p><strong>eBay Compliance:</strong> ✅ GET challenge validation, ✅ POST notification handling</p>
            <p><strong>Authentication:</strong> ❌ No auth required (eBay spec compliance)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayAccountDeletionTest;
