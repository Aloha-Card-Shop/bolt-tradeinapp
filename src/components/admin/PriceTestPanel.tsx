import { useState } from 'react';

import { supabase } from '../../integrations/supabase/client';

const TEST_PRODUCTS = [
  { id: '497601', name: 'Bramblin (Test Card)' },
  { id: '496033', name: 'Charizard ex (Popular)' },
  { id: '123456', name: 'Invalid ID (Error Test)' }
];

interface TestResult {
  duration: string;
  attempt: number;
  success: boolean;
  testType: string;
  error?: string;
  [key: string]: any;
}

export const PriceTestPanel = () => {
  const [productId, setProductId] = useState('497601');
  const [condition, setCondition] = useState('near_mint');
  const [game, setGame] = useState('pokemon');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'edge-function'>('edge-function');
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const runTestWithRetry = async (testFunction: () => Promise<any>, type: 'edge-function') => {
    if (circuitBreakerOpen) {
      setError('Circuit breaker is open. Too many consecutive failures. Try again in 5 minutes.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const maxAttempts = 3;
    const timeoutMs = 30000; // 30 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
        );

        const result = await Promise.race([testFunction(), timeoutPromise]);
        const endTime = Date.now();
        
        const testResult: TestResult = {
          ...(result as object),
          duration: `${endTime - startTime}ms`,
          attempt,
          success: true,
          testType: type
        };
        
        setResults(prev => [testResult, ...prev.slice(0, 4)]); // Keep last 5 results
        setConsecutiveFailures(0);
        setIsLoading(false);
        return;
        
      } catch (err) {
        console.error(`${type} test error (attempt ${attempt}):`, err);
        
        if (attempt === maxAttempts) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(`Failed after ${maxAttempts} attempts: ${errorMsg}`);
          
          const newFailures = consecutiveFailures + 1;
          setConsecutiveFailures(newFailures);
          
          if (newFailures >= 3) {
            setCircuitBreakerOpen(true);
            setTimeout(() => setCircuitBreakerOpen(false), 5 * 60 * 1000); // 5 minutes
          }
          
          const failedResult: TestResult = {
            duration: '0ms',
            attempt,
            success: false,
            testType: type,
            error: errorMsg
          };
          setResults(prev => [failedResult, ...prev.slice(0, 4)]);
        } else {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    setIsLoading(false);
  };

  // Hybrid scraper removed in favor of JustTCG edge function


  const testEdgeFunction = () => runTestWithRetry(
    async () => {
      const { data, error } = await supabase.functions.invoke('justtcg-price', {
        body: {
          productId,
          condition,
          game,
          isFirstEdition: false,
          isHolo: false,
          isReverseHolo: false
        }
      });
      
      if (error) throw new Error(error.message || 'Edge function failed');
      return { ...data, method: 'edge-function' };
    },
    'edge-function'
  );

  // Dual comparison test removed; using JustTCG edge function exclusively

  const runBulkTest = async () => {
    if (circuitBreakerOpen) {
      setError('Circuit breaker is open. Cannot run bulk tests.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    for (const product of TEST_PRODUCTS) {
      const originalProductId = productId;
      setProductId(product.id);
      
      await testEdgeFunction();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between tests
      
      setProductId(originalProductId);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="w-full border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">TCGPlayer Price Test Panel</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Product ID</label>
            <input
              className="input-base"
              value={productId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductId(e.target.value)}
              placeholder="Enter TCGPlayer Product ID"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Condition</label>
            <select 
              value={condition} 
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="mint">Mint</option>
              <option value="near_mint">Near Mint</option>
              <option value="lightly_played">Lightly Played</option>
              <option value="moderately_played">Moderately Played</option>
              <option value="heavily_played">Heavily Played</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Game</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="pokemon">Pokemon</option>
              <option value="japanese-pokemon">Japanese Pokemon</option>
              <option value="magic">Magic: The Gathering</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => { setTestType('edge-function'); testEdgeFunction(); }}
            disabled={isLoading || circuitBreakerOpen}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading && testType === 'edge-function' ? 'Testing...' : 'Test JustTCG' }
          </button>
          <button 
            onClick={() => { setTestType('edge-function'); runBulkTest(); }}
            disabled={isLoading || circuitBreakerOpen}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50"
          >
            {isLoading && testType === 'edge-function' ? 'Running Bulk Test...' : 'Bulk Test (All Products)'}
          </button>
        </div>

        {circuitBreakerOpen && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-800">Circuit Breaker Open</h4>
            <p className="text-orange-700">Too many consecutive failures. Waiting 5 minutes before allowing new tests.</p>
          </div>
        )}

        {isLoading && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Testing price fetch (timeout: 30s, up to 3 retries)...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800">Error:</h4>
            <p className="text-red-700">{error}</p>
            {consecutiveFailures > 0 && (
              <p className="text-red-600 mt-2">Consecutive failures: {consecutiveFailures}/3</p>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results (Last 5):</h4>
            {results.map((result, index) => (
              <div key={index} className={`p-4 border rounded-lg ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? '✓' : '✗'} {result.testType} (Attempt {result.attempt})
                    </h5>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      Duration: {result.duration}
                    </p>
                    {result.error && (
                      <p className="text-red-600 text-sm mt-1">Error: {result.error}</p>
                    )}
                  </div>
                  {result.success && (
                    <span className={`text-xs px-2 py-1 rounded ${result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                  )}
                </div>
                {result.success && (
                  <div className="mt-2">
                    {result.testType === 'dual-comparison' ? (
                      <div className="space-y-2">
                        <div className={`p-2 rounded ${result.scraperSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span className="font-semibold">Hybrid Scraper: </span>
                          <span className={result.scraperSuccess ? 'text-green-700' : 'text-red-700'}>
                            {result.scraperSuccess ? '✓ Success' : '✗ Failed'}
                          </span>
                          {result.scraperSuccess && result.scraperResult?.price && (
                            <span className="ml-2 font-mono bg-green-200 px-2 py-1 rounded">
                              ${result.scraperResult.price}
                            </span>
                          )}
                          {result.scraperResult?.method && (
                            <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                              via {result.scraperResult.method}
                            </span>
                          )}
                        </div>
                        <div className={`p-2 rounded ${result.edgeSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span className="font-semibold">Edge Function: </span>
                          <span className={result.edgeSuccess ? 'text-green-700' : 'text-red-700'}>
                            {result.edgeSuccess ? '✓ Success' : '✗ Failed'}
                          </span>
                          {result.edgeSuccess && result.edgeResult?.price && (
                            <span className="ml-2 font-mono bg-green-200 px-2 py-1 rounded">
                              ${result.edgeResult.price}
                            </span>
                          )}
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600">Show full results</summary>
                          <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-auto max-h-32 mt-1">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : (
                      <div>
                        {/* Show price prominently for single method tests */}
                        {result.price && (
                          <div className="mb-2">
                            <span className="font-semibold">Price Found: </span>
                            <span className="font-mono bg-green-200 px-2 py-1 rounded text-lg">
                              ${result.price}
                            </span>
                            {result.method && (
                              <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                                via {result.method}
                              </span>
                            )}
                            {(result as any).conditionAnomalyAdjusted && (
                              <span className="ml-2 text-xs px-2 py-1 rounded border bg-warning/10 text-warning border-warning/20">
                                Condition anomaly adjusted
                              </span>
                            )}
                          </div>
                        )}
                        {result.data?.price && (
                          <div className="mb-2">
                            <span className="font-semibold">Price Found: </span>
                            <span className="font-mono bg-green-200 px-2 py-1 rounded text-lg">
                              ${result.data.price}
                            </span>
                            {result.data.method && (
                              <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                                via {result.data.method}
                              </span>
                            )}
                            {result.data.conditionAnomalyAdjusted && (
                              <span className="ml-2 text-xs px-2 py-1 rounded border bg-warning/10 text-warning border-warning/20">
                                Condition anomaly adjusted
                              </span>
                            )}
                            {result.data.unavailable && (
                              <span className="ml-2 text-xs bg-orange-100 px-2 py-1 rounded text-orange-700">
                                Price Unavailable
                              </span>
                            )}
                          </div>
                        )}
                        <details>
                          <summary className="cursor-pointer text-xs text-gray-600">Show full response</summary>
                          <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-auto max-h-32 mt-1">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};