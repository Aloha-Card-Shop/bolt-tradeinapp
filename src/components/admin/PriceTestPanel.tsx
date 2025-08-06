import { useState } from 'react';
import { fetchCardPrices } from '../../utils/scraper';
import { FirecrawlService } from '../../utils/FirecrawlService';

export const PriceTestPanel = () => {
  const [productId, setProductId] = useState('497601'); // Bramblin test card
  const [condition, setCondition] = useState('near_mint');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<'scraper' | 'firecrawl'>('scraper');

  const testScraperFunction = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
      );

      const fetchPromise = fetchCardPrices(productId, condition, false, false, 'pokemon');
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const endTime = Date.now();
      
      setResult({
        ...(result as object),
        duration: `${endTime - startTime}ms`,
        testType: 'scraper'
      });
    } catch (err) {
      console.error('Scraper test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testFirecrawlDirect = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
      );

      const fetchPromise = FirecrawlService.scrapeTCGPlayerPrice(productId, condition, 'English', false, false, false);
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const endTime = Date.now();
      
      setResult({
        ...(result as object),
        duration: `${endTime - startTime}ms`,
        testType: 'firecrawl'
      });
    } catch (err) {
      console.error('Firecrawl test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4">TCGPlayer Price Test Panel</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Product ID</label>
            <input
              className="w-full p-2 border rounded"
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
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { setTestType('scraper'); testScraperFunction(); }}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading && testType === 'scraper' ? 'Testing Scraper...' : 'Test Scraper Function'}
          </button>
          <button 
            onClick={() => { setTestType('firecrawl'); testFirecrawlDirect(); }}
            disabled={isLoading}
            className="px-4 py-2 border border-border rounded hover:bg-accent disabled:opacity-50"
          >
            {isLoading && testType === 'firecrawl' ? 'Testing Firecrawl...' : 'Test Firecrawl Direct'}
          </button>
        </div>

        {isLoading && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Testing price fetch (timeout: 10s)...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800">Error:</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800">Result ({result.testType}):</h4>
            <pre className="mt-2 text-sm text-green-700 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};