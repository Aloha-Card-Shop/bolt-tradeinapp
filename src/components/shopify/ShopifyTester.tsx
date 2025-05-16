
import React, { useState } from 'react';
import { useShopify } from '../../hooks/useShopify';
import { toast } from 'react-hot-toast';

interface ShopifyTesterProps {
  tradeInId?: string;
}

const ShopifyTester: React.FC<ShopifyTesterProps> = ({ tradeInId = '' }) => {
  const [testId, setTestId] = useState(tradeInId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { sendToShopify, isLoading } = useShopify();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestId(e.target.value);
  };

  const runTest = async () => {
    if (!testId) {
      toast.error("Please enter a trade-in ID");
      return;
    }

    setIsSubmitting(true);
    setTestResult(null);

    try {
      console.log('Starting Shopify sync test for trade-in ID:', testId);
      const result = await sendToShopify(testId);
      
      console.log('Shopify sync test result:', result);
      
      if (result) {
        setTestResult({
          success: true,
          message: `Successfully sent trade-in ${testId} to Shopify`
        });
        toast.success(`Trade-in sync successful!`);
      } else {
        setTestResult({
          success: false,
          message: `Failed to send trade-in ${testId} to Shopify. Check console for details.`
        });
        toast.error(`Trade-in sync failed. Check console for details.`);
      }
    } catch (error) {
      console.error('Error during Shopify test:', error);
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Shopify Integration Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Trade-in ID:</label>
        <input
          type="text"
          value={testId}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter trade-in ID to test"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={runTest}
          disabled={isLoading || isSubmitting}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
        >
          {isSubmitting ? 'Testing...' : 'Run Shopify Sync Test'}
        </button>
      </div>

      {testResult && (
        <div className={`mt-4 p-4 border rounded-md ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.message}
          </p>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Testing Instructions:</h3>
        <ol className="text-sm text-gray-600 list-decimal pl-5">
          <li>Enter a valid trade-in ID (must exist in your database)</li>
          <li>Click "Run Shopify Sync Test" to test sending the trade-in to Shopify</li>
          <li>Check the console for detailed logs of the operation</li>
          <li>The response will indicate if the sync was successful</li>
        </ol>
      </div>
    </div>
  );
};

export default ShopifyTester;
