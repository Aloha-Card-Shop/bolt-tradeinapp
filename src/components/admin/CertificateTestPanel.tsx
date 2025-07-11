import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const CertificateTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testCertNumber, setTestCertNumber] = useState('49392223');

  const testCertificateLookup = async () => {
    setIsLoading(true);
    setTestResult('Testing Certificate Lookup...\n');
    
    try {
      console.log('[CERT TEST] Starting test with certificate:', testCertNumber);
      setTestResult(prev => prev + `Calling cert-lookup function with certificate: ${testCertNumber}\n`);
      
      const { data, error } = await supabase.functions.invoke('cert-lookup', {
        body: { certNumber: testCertNumber }
      });
      
      if (error) {
        setTestResult(prev => prev + `Error: ${JSON.stringify(error, null, 2)}\n`);
        console.error('[CERT TEST] Error:', error);
      } else {
        setTestResult(prev => prev + `Success!\n`);
        setTestResult(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);
        console.log('[CERT TEST] Success:', data);
      }
      
    } catch (error: any) {
      setTestResult(prev => prev + `Fetch error: ${error.message}\n`);
      console.error('[CERT TEST] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testPsaScraper = async () => {
    setIsLoading(true);
    setTestResult('Testing PSA Scraper directly...\n');
    
    try {
      console.log('[PSA SCRAPER TEST] Starting test with certificate:', testCertNumber);
      setTestResult(prev => prev + `Calling psa-scraper function with certificate: ${testCertNumber}\n`);
      
      const { data, error } = await supabase.functions.invoke('psa-scraper', {
        body: { certNumber: testCertNumber }
      });
      
      if (error) {
        setTestResult(prev => prev + `Error: ${JSON.stringify(error, null, 2)}\n`);
        console.error('[PSA SCRAPER TEST] Error:', error);
      } else {
        setTestResult(prev => prev + `Success!\n`);
        setTestResult(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);
        console.log('[PSA SCRAPER TEST] Success:', data);
      }
      
    } catch (error: any) {
      setTestResult(prev => prev + `Fetch error: ${error.message}\n`);
      console.error('[PSA SCRAPER TEST] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Certificate Lookup Test</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="certNumber" className="block text-sm font-medium text-gray-700">
            Certificate Number
          </label>
          <input
            id="certNumber"
            type="text"
            value={testCertNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestCertNumber(e.target.value)}
            placeholder="Enter PSA certificate number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testCertificateLookup}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Certificate Lookup'}
          </button>
          
          <button
            onClick={testPsaScraper}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test PSA Scraper Only'}
          </button>
        </div>
        
        {testResult && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Test Results:</label>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96 font-mono border">
              {testResult}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Known working certificate numbers:</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>49392223 - Pokemon card</li>
            <li>82674292 - Pokemon card</li>
            <li>25777273 - Pokemon card</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CertificateTestPanel;