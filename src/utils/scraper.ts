interface CacheEntry {
  price: number;
  timestamp: number;
}

const SCRAPER_URL = 'https://tcgplayer-scraper-production.up.railway.app/scrape-price';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const priceCache = new Map<string, CacheEntry>();

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [url, entry] of priceCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      priceCache.delete(url);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

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

  const formattedCondition = condition 
    ? condition.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Near Mint';

  // Build base URL with condition and language
  let url = `https://www.tcgplayer.com/product/${productId}?page=1&Language=${language}&Condition=${formattedCondition}`;
  
  // Add printing parameter (First Edition or Unlimited)
  if (isFirstEdition) {
    url += '&Printing=1st+Edition';
  }
  
  // Add treatment parameter for holo cards
  if (isHolo) {
    url += '&Treatment=Holofoil';
    
    // Special case for 1st Edition Holo (needs different format than just appending both params)
    if (isFirstEdition) {
      // Fix: Replace the existing printing parameter with combined version
      url = url.replace('&Printing=1st+Edition', '&Printing=1st+Edition+Holofoil');
    }
  } else if (isReverseHolo) {
    // Handle reverse holo (which is mutually exclusive with regular holo)
    if (isFirstEdition) {
      url = url.replace('&Printing=1st+Edition', '&Printing=1st+Edition+Reverse+Holofoil');
    } else {
      url += '&Printing=Reverse+Holofoil';
    }
  }
  
  // Add debugging to help diagnose URL construction
  console.log('Price fetch URL:', url, {
    productId, condition, language, isFirstEdition, isHolo, isReverseHolo
  });
  
  return url;
};

export const fetchCardPrices = async (
  productId: string,
  condition: string, 
  isFirstEdition?: boolean,
  isHolo?: boolean,
  game?: string,
  isReverseHolo?: boolean
): Promise<{ price: string }> => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const language = game === 'japanese-pokemon' ? 'Japanese' : 'English';
    const url = buildTcgPlayerUrl(
      productId, 
      condition, 
      language, 
      isFirstEdition, 
      isHolo,
      isReverseHolo
    );

    // Check cache first
    const cachedEntry = priceCache.get(url);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      return { price: cachedEntry.price.toFixed(2) };
    }

    console.log('Fetching price from:', url);
    
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
    console.log('Price data received:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (!data.price && data.price !== 0) {
      throw new Error('Price not found in response');
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
        priceValue = 0;
      }
    } else if (typeof data.price === 'number') {
      // If price is already a number, just use it
      priceValue = data.price;
    } else {
      console.error('Unexpected price format:', typeof data.price, data.price);
      priceValue = 0;
    }

    // Cache the cleaned price
    priceCache.set(url, {
      price: priceValue,
      timestamp: Date.now()
    });

    return { price: priceValue.toFixed(2) };
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch price data');
  }
};
