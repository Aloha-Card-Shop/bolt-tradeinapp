// Test script to compare Railway vs Render scraping endpoints
// Run this in the browser console or as a standalone test

const testEndpoints = async () => {
  const testUrl = "https://www.tcgplayer.com/product/198091/pokemon-sword-shield-charizard-vmax";
  
  const railwayEndpoint = "https://tcgplayer-scraper-production.up.railway.app/scrape-price";
  const renderEndpoint = "https://render-tcgplayer-scraper.onrender.com/scrape-price";
  
  const testEndpoint = async (name: string, endpoint: string) => {
    console.log(`\n🧪 Testing ${name} endpoint...`);
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
      
      console.log(`✅ ${name} - Success (${duration}ms)`);
      console.log(`Response:`, data);
      
      return { success: true, data, duration, endpoint: name };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`❌ ${name} - Failed (${duration}ms)`);
      console.log(`Error:`, error);
      
      return { success: false, error: error instanceof Error ? error.message : String(error), duration, endpoint: name };
    }
  };
  
  console.log("🚀 Starting scraper endpoint comparison test...");
  console.log(`Test URL: ${testUrl}`);
  
  // Test both endpoints
  const [railwayResult, renderResult] = await Promise.all([
    testEndpoint("Railway", railwayEndpoint),
    testEndpoint("Render", renderEndpoint)
  ]);
  
  // Summary
  console.log("\n📊 Test Results Summary:");
  console.log("========================");
  
  const results = [railwayResult, renderResult];
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.endpoint}: ${result.duration}ms - Data received`);
    } else {
      console.log(`❌ ${result.endpoint}: ${result.duration}ms - ${result.error}`);
    }
  });
  
  // Recommendation
  const successfulEndpoints = results.filter(r => r.success);
  if (successfulEndpoints.length > 0) {
    const fastest = successfulEndpoints.reduce((prev, current) => 
      (prev.duration < current.duration) ? prev : current
    );
    console.log(`\n🏆 Recommended: ${fastest.endpoint} (fastest working endpoint)`);
  } else {
    console.log("\n⚠️  No endpoints are currently working");
  }
  
  return { railwayResult, renderResult };
};

// Export for use in other files
export { testEndpoints };