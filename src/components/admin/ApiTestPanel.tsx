
import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';

const ApiTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testEdgeFunction = async () => {
    setIsLoading(true);
    setTestResult('Testing Edge Function...\n');
    
    try {
      console.log('[EDGE FUNCTION TEST] Starting test');
      setTestResult(prev => prev + 'Calling edge function: trade-value-settings\n');
      
      const { data, error } = await supabase.functions.invoke('trade-value-settings', {
        body: { action: 'get', game: 'pokemon' }
      });
      
      if (error) {
        setTestResult(prev => prev + `Error: ${JSON.stringify(error, null, 2)}\n`);
        console.error('[EDGE FUNCTION TEST] Error:', error);
      } else {
        setTestResult(prev => prev + `Success!\n`);
        setTestResult(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);
        console.log('[EDGE FUNCTION TEST] Success:', data);
      }
      
    } catch (error: any) {
      setTestResult(prev => prev + `Fetch error: ${error.message}\n`);
      console.error('[EDGE FUNCTION TEST] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <h3 className="font-medium mb-2">Edge Function Test</h3>
      <button
        onClick={testEdgeFunction}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Edge Function'}
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
