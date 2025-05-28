
import { useEffect, useCallback } from 'react';

interface PersistenceOptions {
  key: string;
  data: any;
  saveInterval?: number;
}

export const useLocalStoragePersistence = ({ key, data, saveInterval = 1000 }: PersistenceOptions) => {
  
  // Save data to localStorage
  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Data saved to localStorage with key: ${key}`);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key, data]);

  // Load data from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, [key]);

  // Clear data from localStorage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
      console.log(`Data cleared from localStorage with key: ${key}`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, [key]);

  // Auto-save data when it changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const timeoutId = setTimeout(saveToStorage, saveInterval);
      return () => clearTimeout(timeoutId);
    }
  }, [data, saveToStorage, saveInterval]);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
};
