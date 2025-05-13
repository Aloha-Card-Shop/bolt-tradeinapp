
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CardDetails } from '../../types/card';
import { SetOption } from '../useSetOptions';
import { getCardNumberString } from '../../utils/cardSearchUtils';

export interface SearchError {
  message: string;
  isTimeout: boolean;
  isJsonError: boolean;
  isSchemaError: boolean;
  isSyntaxError: boolean;
  cardNumber?: string | null;
}

export const useSearchErrorHandler = (
  lastSearchParams: {
    cardDetails: CardDetails | null;
    setOptions: SetOption[];
  },
  searchCardsFn: (cardDetails: CardDetails, setOptions: SetOption[]) => Promise<Set<number>>
) => {
  const [searchError, setSearchError] = useState<SearchError | null>(null);
  
  // Clear error state
  const clearError = () => {
    setSearchError(null);
  };

  // Handle search errors and provide appropriate error messages
  const handleSearchError = (error: any, controller: AbortController): Set<number> => {
    console.error('❌ Error searching cards:', error);
    
    // Skip error notifications if search was aborted
    if (controller.signal.aborted) {
      return new Set<number>();
    }
    
    // Check if this is a card number search
    const isCardNumberSearch = lastSearchParams.cardDetails?.number ? true : false;
    const cardNumber = isCardNumberSearch ? 
                      getCardNumberString(lastSearchParams.cardDetails?.number) : 
                      null;
    
    // Provide more specific error messages for different cases
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message === 'Search timeout') {
        setSearchError({
          message: 'The search is taking longer than expected.',
          isTimeout: true,
          isJsonError: false,
          isSchemaError: false,
          isSyntaxError: false,
          cardNumber
        });
        
        toast.error('The search is taking longer than expected. Try a more specific search term.');
      } else if (error.message.includes('operator does not exist')) {
        // Special handler for PostgreSQL "operator does not exist" errors
        // This happens with JSONB queries when the field doesn't exist or the structure is different
        const message = isCardNumberSearch ? 
          `Card number "${cardNumber}" couldn't be found in the database format. Try searching by name instead.` :
          'Database query error. Please try a different search term.';
        
        setSearchError({
          message,
          isJsonError: true,
          isTimeout: false,
          isSchemaError: false,
          isSyntaxError: false,
          cardNumber
        });
        
        toast.error(message);
      } else if (error.message.includes('JSON') || error.message.includes('jsonb')) {
        const message = isCardNumberSearch ? 
                      `Card number "${cardNumber}" format not recognized. Try a different format.` :
                      'We\'re fixing an issue with the card search.';
        
        setSearchError({
          message,
          isJsonError: !isCardNumberSearch,
          isTimeout: false,
          isSchemaError: false,
          isSyntaxError: isCardNumberSearch,
          cardNumber
        });
        
        toast.error(message);
      } else if (error.message.includes('parse') || error.message.includes('syntax')) {
        setSearchError({
          message: 'Search syntax error. Please try a simpler search term.',
          isSyntaxError: true,
          isJsonError: false,
          isTimeout: false,
          isSchemaError: false,
          cardNumber
        });
        
        toast.error('Search syntax error. Please try a simpler search term.');
      } else if (error.message?.includes('does not exist')) {
        // This is a database schema error (column doesn't exist)
        setSearchError({
          message: 'Database schema error. Please try again with different search terms.',
          isSchemaError: true,
          isJsonError: false,
          isTimeout: false,
          isSyntaxError: false,
          cardNumber
        });
        
        toast.error('There was a database error. Please try again in a moment.');
      } else if (error.name !== 'AbortError') {
        // Don't show toast for aborted requests
        setSearchError({
          message: error.message,
          isJsonError: false,
          isTimeout: false,
          isSchemaError: false,
          isSyntaxError: false,
          cardNumber
        });
        
        toast.error(`Search failed: ${error.message}`);
      }
    } else {
      setSearchError({
        message: 'Unknown error',
        isJsonError: false,
        isTimeout: false,
        isSchemaError: false,
        isSyntaxError: false,
        cardNumber
      });
      
      toast.error('Search failed: Unknown error');
    }
    
    return new Set<number>();
  };

  // Function to retry a failed search
  const retrySearch = () => {
    if (lastSearchParams.cardDetails) {
      clearError();
      return searchCardsFn(lastSearchParams.cardDetails, lastSearchParams.setOptions);
    }
    return Promise.resolve(new Set<number>());
  };

  return {
    searchError,
    setSearchError,
    clearError,
    handleSearchError,
    retrySearch
  };
};
