
import { NextRequest, NextResponse } from 'next/server';

// Configure CORS headers for the API response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const requestData = await req.json();
    const { searchQuery, userAgent } = requestData;
    
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate a cache key from the search query
    const cacheKey = `130point-${searchQuery}`;
    
    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      console.log(`Cache hit for query: ${searchQuery}`);
      return NextResponse.json(cachedResponse.data, {
        headers: corsHeaders
      });
    }
    
    // Implement basic rate limiting
    const clientIP = req.ip || 'unknown';
    const now = Date.now();
    
    if (!rateLimits.has(clientIP)) {
      rateLimits.set(clientIP, []);
    }
    
    // Get timestamps of requests in the last minute
    const recentRequests = rateLimits.get(clientIP)!.filter(
      timestamp => now - timestamp < 60 * 1000
    );
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }
    
    // Add current timestamp to requests
    recentRequests.push(now);
    rateLimits.set(clientIP, recentRequests);

    // The URL for 130point.com sales search
    const FORM_SUBMIT_URL = 'https://130point.com/sales/';
    
    // Set up headers to mimic a browser request
    const headers = {
      "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://130point.com/sales/",
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
    };

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
      return NextResponse.json(
        { error: `Request failed with status: ${response.status}` },
        { status: response.status, headers: corsHeaders }
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

    return NextResponse.json(result, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in 130point scraper:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
}
