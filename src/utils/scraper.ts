
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

export const buildTcgPlayerUrl = (productId: string, condition: string | undefined, language: string = 'English'): string => {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  const formattedCondition = condition 
    ? condition.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Near Mint';

  return `https://www.tcgplayer.com/product/${productId}?page=1&Language=${language}&Condition=${formattedCondition}`;
};

export const fetchCardPrices = async (
  productId: string,
  condition: string, 
  _isFirstEdition?: boolean,  // Prefixed with _ to indicate it's unused
  _isHolo?: boolean,          // Prefixed with _ to indicate it's unused
  game?: string
): Promise<{ price: string }> => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const language = game === 'japanese-pokemon' ? 'Japanese' : 'English';
    const url = buildTcgPlayerUrl(productId, condition, language);

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

    // Clean the price and cache it
    const cleanPrice = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanPrice)) {
      throw new Error('Invalid price format received');
    }

    priceCache.set(url, {
      price: cleanPrice,
      timestamp: Date.now()
    });

    return { price: cleanPrice.toFixed(2) };
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch price data');
  }
};
