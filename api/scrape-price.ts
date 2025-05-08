import { chromium } from 'playwright-core';
import * as cheerio from 'cheerio';

interface ScrapeRequest {
  productId: string;
  condition: string;
  language: string;
  isFirstEdition?: boolean;
  isHolo?: boolean;
}

// Cache for storing price data
const priceCache = new Map<string, { price: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { productId, condition, language, isFirstEdition, isHolo } = await req.json() as ScrapeRequest;

    // Generate cache key
    const cacheKey = `${productId}-${condition}-${language}-${isFirstEdition}-${isHolo}`;
    
    // Check cache
    const cachedData = priceCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      return new Response(
        JSON.stringify({ price: cachedData.price }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Build TCGPlayer URL with filters
    let url = `https://www.tcgplayer.com/product/${productId}?page=1&Language=${language}`;
    
    if (condition) {
      url += `&Condition=${condition.replace(/_/g, '+')}`;
    }
    
    if (isFirstEdition) {
      url += '&Printing=1st+Edition';
    }
    
    if (isHolo) {
      url += '&Treatment=Holofoil';
    }

    // Launch browser
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      // Create new page
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      const page = await context.newPage();

      // Set viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to page with timeout and wait for price
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for price element
      await page.waitForSelector('[data-testid="price-guide-price"]', {
        timeout: 10000
      });

      // Get page content and parse with cheerio
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract the market price
      const priceElement = $('[data-testid="price-guide-price"]').first();
      if (!priceElement.length) {
        console.log('Debug - Full HTML:', content);
        throw new Error('Price element not found');
      }

      const price = priceElement.text().trim().replace(/[^0-9.]/g, '');
      if (!price) {
        throw new Error('Invalid price format');
      }

      // Update cache
      priceCache.set(cacheKey, {
        price,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      for (const [key, value] of priceCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
          priceCache.delete(key);
        }
      }

      return new Response(
        JSON.stringify({
          price,
          url,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to scrape price data'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}