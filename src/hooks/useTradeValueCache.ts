
import { useCallback } from 'react';

// Define the interface for the hook to clear cache
interface UseTradeValueCacheReturn {
  clearSettingsCache: (game?: string) => void;
}

/**
 * Hook to manage the trade value settings cache
 * 
 * @returns Object with functions to manage the cache
 */
export function useTradeValueCache(): UseTradeValueCacheReturn {
  const clearSettingsCache = useCallback(async (game?: string) => {
    try {
      // Define the endpoint URL
      const endpoint = '/api/clear-settings-cache';
      
      // Make API request to clear cache
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game })
      });
      
      if (!response.ok) {
        console.error('Failed to clear settings cache:', response.statusText);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error clearing settings cache:', error);
    }
  }, []);

  return { clearSettingsCache };
}
