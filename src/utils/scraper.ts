
import { supabase } from '../lib/supabase';

interface CacheEntry {
  price: number;
  timestamp: number;
}

const SCRAPER_URL = 'https://tcgplayer-scraper-production.up.railway.app/scrape-price';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours (increased from 4 hours)
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const priceCache = new Map<string, CacheEntry>();

// Clean up old cache entries periodically
let cacheCleanupInterval: NodeJS.Timeout | null = null;

const startCacheCleanup = () => {
  if (cacheCleanupInterval) return;
  
  cacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [url, entry] of priceCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        priceCache.delete(url);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);
};

const stopCacheCleanup = () => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
};

// Initialize cleanup when first needed
export const initializeScraper = () => {
  startCacheCleanup();
};

// Export cleanup function for proper shutdown
export const cleanupScraper = () => {
  stopCacheCleanup();
  priceCache.clear();
};

export const buildTcgPlayerUrl = (
  productId: string, 
  condition: string | undefined, 
  language: string = 'English',
  isFirstEdition: boolean = false,
  isHolo: boolean = false,
  isReverseHolo: boolean = false
): string => {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  // Build base URL following the correct format
  let url = `https://www.tcgplayer.com/product/${productId}?Language=${language}&page=1`;
  
  // Add printing parameter for special editions - ONLY if explicitly true
  if (isFirstEdition === true && isHolo === true) {
    url += '&Printing=1st+Edition+Holofoil';
  } else if (isFirstEdition === true && isReverseHolo === true) {
    url += '&Printing=1st+Edition+Reverse+Holofoil';
  } else if (isFirstEdition === true) {
    url += '&Printing=1st+Edition';
  } else if (isHolo === true) {
    url += '&Printing=Holofoil';
  } else if (isReverseHolo === true) {
    url += '&Printing=Reverse+Holofoil';
  }
  // If none of the above conditions are met, don't add any printing parameter
  
  // Add condition if specified
  if (condition) {
    const formattedCondition = condition 
      ? condition.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('+')
      : 'Near+Mint';
    url += `&Condition=${formattedCondition}`;
  }
  
  // Add debugging to help diagnose URL construction
  if (import.meta.env.DEV) {
    console.log('Price fetch URL:', url, {
      productId, condition, language, 
      isFirstEdition: isFirstEdition === true, 
      isHolo: isHolo === true, 
      isReverseHolo: isReverseHolo === true
    });
  }
  
  return url;
};

export const fetchCardPrices = async (
  productId: string,
  condition: string, 
  isFirstEdition?: boolean,
  isHolo?: boolean,
  game?: string,
  isReverseHolo?: boolean
): Promise<{ price: string; unavailable?: boolean }> => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Initialize cache cleanup on first use
    initializeScraper();

    const language = game === 'japanese-pokemon' ? 'Japanese' : 'English';
    
    // Ensure boolean values are explicitly handled - default to false if undefined
    const firstEdition = isFirstEdition === true;
    const holo = isHolo === true;
    const reverseHolo = isReverseHolo === true;
    
    const url = buildTcgPlayerUrl(
      productId, 
      condition, 
      language, 
      firstEdition, 
      holo,
      reverseHolo
    );

    // Check cache first
    const cachedEntry = priceCache.get(url);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      return { price: cachedEntry.price.toFixed(2) };
    }

    if (import.meta.env.DEV) {
      console.log('Fetching price from:', url);
    }
    
    const response = await fetch(SCRAPER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.status}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log('Price data received:', data);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Handle case where price is not available
    if (!data.price && data.price !== 0) {
      if (import.meta.env.DEV) {
        console.log('Price not found for this item configuration');
      }
      return { price: "0.00", unavailable: true };
    }

    // Check for indicators of unavailable prices
    if (typeof data.price === 'string' && 
        (data.price === '-' || 
         data.price === 'N/A' || 
         data.price === '$-' || 
         data.price === '$0.00' ||
         data.price.includes('unavailable'))) {
      if (import.meta.env.DEV) {
        console.log('Price not available for this item');
      }
      return { price: "0.00", unavailable: true };
    }

    // Improved price cleaning - handle different formats more robustly
    let priceValue: number;
    
    if (typeof data.price === 'string') {
      // Remove any currency symbol and non-numeric characters except decimal point
      const priceString = data.price.trim().replace(/[^\d.]/g, '');
      
      // Check if we have a valid number format
      priceValue = parseFloat(priceString);
      if (isNaN(priceValue) || !isFinite(priceValue)) {
        console.error('Invalid price format received:', data.price);
        return { price: "0.00", unavailable: true };
      }
    } else if (typeof data.price === 'number') {
      // If price is already a number, just use it
      priceValue = data.price;
    } else {
      console.error('Unexpected price format:', typeof data.price, data.price);
      return { price: "0.00", unavailable: true };
    }

    // Ensure price is formatted to 2 decimal places for consistency
    const formattedPrice = parseFloat(priceValue.toFixed(2));

    // Cache the formatted price
    priceCache.set(url, {
      price: formattedPrice,
      timestamp: Date.now()
    });

    return { price: formattedPrice.toFixed(2) };
  } catch (error) {
    console.error('Error fetching price:', error);
    return { price: "0.00", unavailable: true };
  }
};

// Add a function to update card prices in the database
export const updateCardPrice = async (
  cardId: string, 
  price: number, 
  priceType: 'market_price' | 'low_price' | 'mid_price' | 'high_price' = 'market_price'
): Promise<boolean> => {
  try {
    if (!cardId || typeof price !== 'number') {
      console.error('Invalid parameters for updateCardPrice:', { cardId, price, priceType });
      return false;
    }
    
    // Create update object with only the field we want to update
    const updateData: any = {
      [priceType]: price,
      last_updated: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId);
    
    if (error) {
      console.error('Failed to update card price:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCardPrice:', error);
    return false;
  }
};
