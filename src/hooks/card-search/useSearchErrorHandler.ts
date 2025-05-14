
import { useState, useCallback } from 'react';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { toast } from 'react-hot-toast';

type SearchErrorType = {
  message: string;
  isTimeout: boolean;
  isJsonError: boolean;
  isSchemaError: boolean;
  isSyntaxError: boolean;
  cardNumber?: string | null;
} | null;

export const useSearchErrorHandler = (
  lastSearchParams: {
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  },
  searchCardsFunction: (cardDetails: CardDetails, setOptions: SetOption[]) => Promise<any>
) => {
  const [searchError, setSearchError] = useState<SearchErrorType>(null);

  // Clear error state
  const clearError = useCallback(() => {
    if (searchError) {
      setSearchError(null);
    }
  }, [searchError]);

  // Handle search errors with improved type detection and messaging
  const handleSearchError = useCallback((error: any, abortController: AbortController) => {
    // Skip errors from aborted requests
    if (abortController.signal.aborted) {
      console.log('Error ignored: Search was aborted');
      return new Set<number>();
    }

    console.error('Search error:', error);
    
    // Create a typed error object
    let errorObj: SearchErrorType = {
      message: error.message || 'An unknown error occurred',
      isTimeout: false,
      isJsonError: false,
      isSchemaError: false,
      isSyntaxError: false
    };
    
    // Check for specific error types
    if (error.message) {
      const msg = error.message.toLowerCase();
      
      // Timeout errors
      if (msg.includes('timeout') || msg.includes('timed out') || error.code === 'ETIMEDOUT') {
        errorObj.isTimeout = true;
        errorObj.message = 'Search timed out. Please try a more specific search.';
        toast.error('Search timed out. Try a more specific search.');
      } 
      // JSON parsing errors
      else if (msg.includes('json') || msg.includes('parse')) {
        errorObj.isJsonError = true;
        errorObj.message = 'Error parsing search results. Please try again.';
        toast.error('Error parsing search results.');
      } 
      // Schema errors
      else if (msg.includes('schema') || msg.includes('column') || msg.includes('does not exist')) {
        errorObj.isSchemaError = true;
        errorObj.message = 'Database schema error. Our team has been notified.';
        toast.error('Database error. Please try again later.');
      }
      // Syntax errors
      else if (msg.includes('syntax') || msg.includes('invalid')) {
        errorObj.isSyntaxError = true;
        errorObj.message = 'Invalid search syntax. Please try a simpler search.';
        toast.error('Invalid search format. Try a simpler search.');
      }
      
      // Add card number if this was a card number search error
      if (error.cardNumber) {
        errorObj.cardNumber = error.cardNumber;
        errorObj.message = `Invalid card number format: "${error.cardNumber}". Try a different format.`;
        toast.error(`Invalid card number format: ${error.cardNumber}`);
      }
    }
    
    setSearchError(errorObj);
    return new Set<number>();
  }, []);
  
  // Retry search function
  const retrySearch = useCallback(() => {
    if (!lastSearchParams.cardDetails) {
      toast.error('No search parameters available to retry');
      return;
    }
    
    console.log('Retrying search with:', lastSearchParams);
    clearError();
    return searchCardsFunction(
      lastSearchParams.cardDetails,
      lastSearchParams.setOptions
    );
  }, [lastSearchParams, clearError, searchCardsFunction]);

  return {
    searchError,
    clearError,
    handleSearchError,
    retrySearch
  };
};
