
import { supabase } from '../integrations/supabase/client';

interface CacheEntry {
  price: number;
  timestamp: number;
}
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

// Define condition hierarchy from best to worst
const CONDITION_HIERARCHY = [
  'mint',
  'near_mint', 
  'lightly_played',
  'moderately_played', 
  'heavily_played',
  'damaged'
];

export const fetchCardPrices = async (
  productId: string,
  condition: string, 
  isFirstEdition?: boolean,
  isHolo?: boolean,
  game?: string,
  isReverseHolo?: boolean,
  timeoutMs: number = 10000
): Promise<{ price: string; unavailable?: boolean; actualCondition?: string; usedFallback?: boolean; method?: string; conditionAnomalyAdjusted?: boolean; adjustmentNote?: string }> => {
  // Helper function to try fetching price using edge function
  const tryFetchPriceWithEdgeFunction = async (conditionToTry: string): Promise<{ price: string; unavailable?: boolean; actualCondition?: string; method: string; conditionAnomalyAdjusted?: boolean; adjustmentNote?: string }> => {
    try {
      
      const firstEdition = isFirstEdition === true;
      const holo = isHolo === true;
      const reverseHolo = isReverseHolo === true;
      
      const { data, error } = await supabase.functions.invoke('justtcg-price', {
        body: {
          productId,
          condition: conditionToTry,
          isFirstEdition: firstEdition,
          isHolo: holo,
          isReverseHolo: reverseHolo,
          game
        }
      });

      if (error) {
        throw new Error(error.message || 'Edge function failed');
      }

      const raw = data?.price;
      const numeric = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('$', ''));
      if (numeric && numeric > 0) {
        return {
          price: Number(numeric).toFixed(2),
          actualCondition: conditionToTry,
          method: 'justtcg',
          conditionAnomalyAdjusted: Boolean((data as any)?.conditionAnomalyAdjusted),
          adjustmentNote: (data as any)?.adjustmentNote,
        };
      }

      return { price: "0.00", unavailable: true, method: 'justtcg', conditionAnomalyAdjusted: Boolean((data as any)?.conditionAnomalyAdjusted), adjustmentNote: (data as any)?.adjustmentNote };
    } catch (error) {
      console.error('Edge function price fetch failed:', error);
      throw error;
    }
  };


  // Helper function to try fetching price for a specific condition using edge function only
  const tryFetchPriceForCondition = async (conditionToTry: string): Promise<{ price: string; unavailable?: boolean; actualCondition?: string; method?: string }> => {
    try {
      if (import.meta.env.DEV) {
        console.log('Attempting edge function price fetch for:', productId, conditionToTry);
      }
      
      const edgeResult = await tryFetchPriceWithEdgeFunction(conditionToTry);
      if (!edgeResult.unavailable) {
        if (import.meta.env.DEV) {
          console.log('Edge function successful:', edgeResult);
        }
        return edgeResult;
      }
    } catch (error) {
      console.log('Edge function failed:', error);
    }

    return { price: "0.00", unavailable: true, method: 'edge-function-failed' };
  };

  // Smart condition prioritization based on starting condition
  const getOptimizedConditionOrder = (startingCondition: string): string[] => {
    const startIndex = CONDITION_HIERARCHY.indexOf(startingCondition);
    if (startIndex === -1) return CONDITION_HIERARCHY;
    
    // Try current condition first, then descending order (worse conditions are more likely to have prices)
    const optimizedOrder: string[] = [];
    
    // Add starting condition first
    optimizedOrder.push(startingCondition);
    
    // Add worse conditions (higher index)
    for (let i = startIndex + 1; i < CONDITION_HIERARCHY.length; i++) {
      optimizedOrder.push(CONDITION_HIERARCHY[i]);
    }
    
    // Add better conditions (lower index) 
    for (let i = startIndex - 1; i >= 0; i--) {
      optimizedOrder.push(CONDITION_HIERARCHY[i]);
    }
    
    return [...new Set(optimizedOrder)]; // Remove duplicates
  };

  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Add timeout wrapper for the entire operation
    const timeoutPromise = new Promise<{ price: string; unavailable: true }>((_, reject) => 
      setTimeout(() => reject(new Error(`Price fetch timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const fetchPromise = (async () => {
      // Initialize cache cleanup on first use
      initializeScraper();

      // Limit condition fallbacks to maximum 2 conditions for faster response
      const conditionsToTry = getOptimizedConditionOrder(condition).slice(0, 2);
      
      if (import.meta.env.DEV) {
        console.log(`Trying conditions in order: ${conditionsToTry.join(', ')}`);
      }

      // Try conditions in optimized order
      for (const conditionToTry of conditionsToTry) {
        if (import.meta.env.DEV) {
          console.log(`Trying condition: ${conditionToTry}`);
        }
        
        const result = await tryFetchPriceForCondition(conditionToTry);
        
        if (!result.unavailable) {
          const usedFallback = conditionToTry !== condition;
          if (usedFallback && import.meta.env.DEV) {
            console.log(`Found price for ${conditionToTry} instead of ${condition}`);
          }
          return { ...result, usedFallback };
        }
      }

      // If we get here, no price was found for any condition
      if (import.meta.env.DEV) {
        console.log('No price found for any condition');
      }
      return { price: "0.00", unavailable: true };
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);

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
