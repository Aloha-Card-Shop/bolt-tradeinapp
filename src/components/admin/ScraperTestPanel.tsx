import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const ScraperTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testEndpoints = async () => {
    setTesting(true);
    setResults(null);
    
    const testUrl = "https://www.tcgplayer.com/product/198091/pokemon-sword-shield-charizard-vmax";
    const railwayEndpoint = "https://tcgplayer-scraper-production.up.railway.app/scrape-price";
    const renderEndpoint = "https://render-tcgplayer-scraper.onrender.com/scrape-price";
    
    const testEndpoint = async (name: string, endpoint: string) => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: testUrl })
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return { success: true, data, duration, endpoint: name };
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error), 
          duration, 
          endpoint: name 
        };
      }
    };
    
    try {
      const [railwayResult, renderResult] = await Promise.all([
        testEndpoint("Railway", railwayEndpoint),
        testEndpoint("Render", renderEndpoint)
      ]);
      
      setResults({ railwayResult, renderResult });
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Scraper Endpoint Test</h2>
      </div>
      <div className="p-6 space-y-4">
        <button 
          onClick={testEndpoints} 
          disabled={testing}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Endpoints...
            </>
          ) : (
            'Test Both Endpoints'
          )}
        </button>
        
        {results && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Railway Results */}
              <div className="bg-white border rounded-lg shadow">
                <div className="border-b p-4">
                  <div className="text-base font-medium flex items-center gap-2">
                    Railway Endpoint
                    <span className={`px-2 py-1 rounded text-xs ${results.railwayResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {results.railwayResult.success ? "Success" : "Failed"}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-sm">
                    <strong>Duration:</strong> {results.railwayResult.duration}ms
                  </div>
                  {results.railwayResult.success ? (
                    <div className="text-sm">
                      <strong>Price:</strong> ${results.railwayResult.data?.market_price || 'N/A'}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {results.railwayResult.error}
                    </div>
                  )}
                  {results.railwayResult.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">Raw Response</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(results.railwayResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              {/* Render Results */}
              <div className="bg-white border rounded-lg shadow">
                <div className="border-b p-4">
                  <div className="text-base font-medium flex items-center gap-2">
                    Render Endpoint
                    <span className={`px-2 py-1 rounded text-xs ${results.renderResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {results.renderResult.success ? "Success" : "Failed"}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-sm">
                    <strong>Duration:</strong> {results.renderResult.duration}ms
                  </div>
                  {results.renderResult.success ? (
                    <div className="text-sm">
                      <strong>Price:</strong> ${results.renderResult.data?.market_price || 'N/A'}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {results.renderResult.error}
                    </div>
                  )}
                  {results.renderResult.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">Raw Response</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(results.renderResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="bg-blue-50 border rounded-lg">
              <div className="p-4">
                <div className="text-sm">
                  {(() => {
                    const successfulEndpoints = [results.railwayResult, results.renderResult].filter(r => r.success);
                    if (successfulEndpoints.length > 0) {
                      const fastest = successfulEndpoints.reduce((prev, current) => 
                        (prev.duration < current.duration) ? prev : current
                      );
                      return (
                        <div>
                          <strong>🏆 Recommendation:</strong> Use <strong>{fastest.endpoint}</strong> endpoint 
                          (fastest working at {fastest.duration}ms)
                        </div>
                      );
                    } else {
                      return <div><strong>⚠️ Warning:</strong> No endpoints are currently working</div>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScraperTestPanel;