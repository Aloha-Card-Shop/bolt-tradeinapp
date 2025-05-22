
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Default to false on server/during initial render
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create a media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQuery.matches);

    // Define a callback function to handle changes
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    // Add the callback as a listener for changes to the media query
    mediaQuery.addEventListener('change', handler);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
