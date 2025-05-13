
/**
 * Store search history in localStorage
 * @param key The localStorage key
 * @param term The search term to add
 * @param maxItems Maximum number of items to store
 * @returns The updated history array
 */
export const addToSearchHistory = (key: string, term: string, maxItems: number = 10): string[] => {
  try {
    const savedHistory = localStorage.getItem(key);
    let history: string[] = [];
    
    if (savedHistory) {
      history = JSON.parse(savedHistory);
    }
    
    // Remove if already exists
    history = history.filter(item => item !== term);
    
    // Add to the beginning
    history.unshift(term);
    
    // Limit the number of items
    history = history.slice(0, maxItems);
    
    localStorage.setItem(key, JSON.stringify(history));
    
    return history;
  } catch (e) {
    console.error('Error storing search history:', e);
    return [];
  }
};

/**
 * Get search history from localStorage
 * @param key The localStorage key
 * @returns Array of search history items
 */
export const getSearchHistory = (key: string): string[] => {
  try {
    const savedHistory = localStorage.getItem(key);
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    console.error('Error retrieving search history:', e);
    return [];
  }
};
