
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Configure CORS headers for the API response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple cache implementation
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Rate limiting
const rateLimits = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 10;

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

// Generate cookies to simulate browser state
const generateCookies = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14); // 2 weeks from now
  
  return [
    `_ga=GA1.2.${Math.floor(Math.random() * 1000000000)}.${Date.now()}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`,
    `_gid=GA1.2.${Math.floor(Math.random() * 1000000000)}.${Date.now()}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`,
    `_gat=1; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`,
    `session_id=${Math.random().toString(36).substring(2, 15)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
  ].join('; ');
};

// Generate accept header based on user agent
const getAcceptHeader = (userAgent: string) => {
  if (userAgent.includes('Firefox')) {
    return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  } else if (userAgent.includes('Chrome')) {
    return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
  } else {
    return 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  }
};

// Add random delay between requests to mimic human behavior
const addRandomDelay = async (min = 800, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: {...corsHeaders, 'Content-Type': 'application/json'} }
    );
  }

  try {
    const requestData = await req.json();
    const { searchQuery, fingerprint, strategy } = requestData;
    
    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: {...corsHeaders, 'Content-Type': 'application/json'} }
      );
    }

    // Generate a cache key from the search query and strategy
    const cacheKey = `130point-${searchQuery}-${strategy || 'standard'}`;
    
    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      console.log(`Cache hit for query: ${searchQuery}`);
      return new Response(
        JSON.stringify(cachedResponse.data),
        { headers: {...corsHeaders, 'Content-Type': 'application/json'} }
      );
    }
    
    // Implement basic rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    
    if (!rateLimits.has(clientIP)) {
      rateLimits.set(clientIP, []);
    }
    
    // Get timestamps of requests in the last minute
    const recentRequests = rateLimits.get(clientIP)!.filter(
      timestamp => now - timestamp < 60 * 1000
    );
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: {...corsHeaders, 'Content-Type': 'application/json'} }
      );
    }
    
    // Add current timestamp to requests
    recentRequests.push(now);
    rateLimits.set(clientIP, recentRequests);

    // The URL for 130point.com sales search
    const FORM_SUBMIT_URL = 'https://130point.com/sales/';
    
    // Use browser fingerprint data if provided, or generate default
    const browserFP = fingerprint || {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      platform: "Win32",
      language: "en-US,en;q=0.9",
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      timezone: -5
    };
    
    const cookies = generateCookies();
    const acceptHeader = getAcceptHeader(browserFP.userAgent);
    
    // Set up headers to mimic a browser request
    const headers = {
      "User-Agent": browserFP.userAgent,
      "Accept": acceptHeader,
      "Accept-Language": browserFP.language,
      "Referer": "https://130point.com/sales/",
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": browserFP.platform.includes("iPhone") ? "?1" : "?0",
      "Sec-Ch-Ua-Platform": `"${browserFP.platform}"`,
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Priority": "u=0, i",
      "Cookie": cookies
    };

    // Add human-like delay
    await addRandomDelay();

    // Create form data for POST request
    const formData = new URLSearchParams();
    formData.append("search", searchQuery);
    formData.append("searchButton", "");
    formData.append("sortBy", "date_desc");
    
    console.log(`Searching 130point.com for: ${searchQuery}`);
    
    // Make the request to 130point.com
    const response = await fetch(FORM_SUBMIT_URL, {
      method: 'POST',
      headers,
      body: formData,
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Request failed with status: ${response.status}` }),
        { status: response.status, headers: {...corsHeaders, 'Content-Type': 'application/json'} }
      );
    }

    // Get the HTML response as text
    const html = await response.text();
    
    // Store result in cache
    const result = { html };
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return new Response(
      JSON.stringify(result),
      { headers: {...corsHeaders, 'Content-Type': 'application/json'} }
    );
  } catch (error) {
    console.error('Error in 130point scraper:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: {...corsHeaders, 'Content-Type': 'application/json'} }
    );
  }
});
