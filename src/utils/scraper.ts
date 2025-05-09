
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

  let url = `https://www.tcgplayer.com/product/${productId}?page=1&Language=${language}&Condition=${formattedCondition}`;
  
  // Add printing parameters
  if (isFirstEdition) {
    url += '&Printing=1st+Edition';
  }
  
  // Add treatment parameters - Holo and Reverse Holo are mutually exclusive
  if (isHolo) {
    url += '&Treatment=Holofoil';
  } else if (isReverseHolo) {
    url += '&Printing=Reverse+Holofoil';
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
    
    if (!data.price) {
      throw new Error('Price not found in response');
    }

    // Improved price cleaning - handle different formats more robustly
    let priceString = data.price;
    if (typeof priceString === 'string') {
      // Remove any currency symbol and non-numeric characters except decimal point
      priceString = priceString.replace(/[^\d.]/g, '');
      
      // Check if we have a valid number format
      const cleanPrice = parseFloat(priceString);
      if (isNaN(cleanPrice)) {
        throw new Error('Invalid price format received');
      }

      // Cache the cleaned price
      priceCache.set(url, {
        price: cleanPrice,
        timestamp: Date.now()
      });

      return { price: cleanPrice.toFixed(2) };
    } else if (typeof data.price === 'number') {
      // If price is already a number, just format it
      priceCache.set(url, {
        price: data.price,
        timestamp: Date.now()
      });
      return { price: data.price.toFixed(2) };
    } else {
      throw new Error('Invalid price format received');
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch price data');
  }
};
