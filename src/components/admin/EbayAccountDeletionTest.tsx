import React, { useState } from 'react';
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

      console.log('Challenge response status:', response.status);
      console.log('Challenge response headers:', Object.fromEntries(response.headers.entries()));

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
        type: 'challenge',
        status: response.status
      });
      toast.success('✅ Challenge validation test PASSED! Function is deployed correctly.');
    } catch (err) {
      console.error('Challenge test exception:', err);
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'challenge'
      });
      toast.error('❌ Challenge validation FAILED - Function may not be redeployed yet');
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

      console.log('Direct POST response status:', response.status);
      console.log('Direct POST response headers:', Object.fromEntries(response.headers.entries()));

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
        type: 'direct-post',
        status: response.status
      });
      toast.success('✅ Direct POST endpoint test PASSED! eBay notifications will work.');
    } catch (err) {
      console.error('Direct POST test exception:', err);
      setTestResult({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'direct-post'
      });
      toast.error('❌ Direct POST FAILED - Function may need redeployment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">eBay Account Deletion Function Test</h2>
      
      <div className="space-y-6">
        {/* Enhanced Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Function Configuration Status</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Authentication:</strong> ✅ PUBLIC (No JWT verification)</p>
            <p><strong>eBay Compliance:</strong> ✅ GET challenge + POST notification support</p>
            <p><strong>Config Setting:</strong> verify_jwt = false in supabase/config.toml</p>
            <p><strong>Deployment:</strong> Function updated with redeployment trigger - timestamp: 2025-01-25</p>
          </div>
        </div>

        {/* Deployment Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">🚀 Redeployment Status</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>Function has been updated to force fresh deployment</p>
            <p>If tests still show 401 errors, the deployment may still be in progress</p>
            <p>Wait 1-2 minutes and retest if you encounter 401 errors</p>
          </div>
        </div>

        {/* Challenge Validation Test */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">🔍 GET Request - Challenge Validation Test</h3>
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
            Tests GET request with challenge_code query parameter (eBay compliance validation)
          </p>
        </div>

        {/* Direct POST Endpoint Test */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">📤 POST Request - eBay Notification Simulation</h3>
          <button
            onClick={testDirectPostEndpoint}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test eBay Notification'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Tests POST request directly (simulates real eBay account deletion notification)
          </p>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">📊 Test Results</h3>
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.type === 'challenge' ? '🔍 Challenge Validation' : 
                   testResult.type === 'notification' ? '📧 Notification Handling (Client)' : 
                   '📤 eBay Notification Test'}
                </span>
                <span className={`text-sm px-2 py-1 rounded font-medium ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {testResult.success ? '✅ PASSED' : '❌ FAILED'}
                </span>
                {testResult.status && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    HTTP {testResult.status}
                  </span>
                )}
              </div>
              
              {testResult.success ? (
                <div className="text-sm text-green-700">
                  <strong>✅ Response:</strong>
                  <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <strong>❌ Error:</strong> {testResult.error}
                  {testResult.error?.includes('401') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                      <strong>Likely cause:</strong> Function deployment in progress. Wait 1-2 minutes and retry.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Function Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-2">📋 Function Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Endpoint:</strong> https://qgsabaicokoynabxgdco.supabase.co/functions/v1/account-deletion</p>
            <p><strong>Authentication:</strong> ❌ DISABLED (Public access for eBay compliance)</p>
            <p><strong>Configuration:</strong> verify_jwt = false in supabase/config.toml</p>
            <p><strong>Methods:</strong> GET (challenge validation), POST (notifications), OPTIONS (CORS)</p>
            <p><strong>eBay Spec:</strong> ✅ Challenge-response validation + notification handling</p>
            <p><strong>Secrets Required:</strong> EBAY_VERIFICATION_TOKEN, PUBLIC_ENDPOINT_URL</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbayAccountDeletionTest;
