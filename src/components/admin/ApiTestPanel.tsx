
import React, { useState } from 'react';

const ApiTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testApiEndpoint = async () => {
    setIsLoading(true);
    setTestResult('Testing API endpoint...\n');
    
    try {
      const baseUrl = window.location.origin;
      const testUrl = `${baseUrl}/api/trade-value-settings?game=pokemon&test=1`;
      
      console.log('[API TEST] Testing URL:', testUrl);
      setTestResult(prev => prev + `Testing URL: ${testUrl}\n`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setTestResult(prev => prev + `Response status: ${response.status} ${response.statusText}\n`);
      setTestResult(prev => prev + `Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n`);
      
      const responseText = await response.text();
      setTestResult(prev => prev + `Raw response: ${responseText.substring(0, 1000)}\n`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const jsonData = JSON.parse(responseText);
          setTestResult(prev => prev + `Parsed JSON: ${JSON.stringify(jsonData, null, 2)}\n`);
        } catch (parseError) {
          setTestResult(prev => prev + `JSON parse error: ${parseError}\n`);
        }
      } else {
        setTestResult(prev => prev + 'Response is not JSON\n');
      }
      
    } catch (error: any) {
      setTestResult(prev => prev + `Fetch error: ${error.message}\n`);
      console.error('[API TEST] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <h3 className="font-medium mb-2">API Endpoint Test</h3>
      <button
        onClick={testApiEndpoint}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test API Endpoint'}
      </button>
      
      {testResult && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTestPanel;
