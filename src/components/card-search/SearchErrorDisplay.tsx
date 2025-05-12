
import React from 'react';
import { AlertCircle, Database, Code, Clock, RefreshCw } from 'lucide-react';

interface SearchErrorDisplayProps {
  error: string | null;
  isTimeout?: boolean;
  isJsonError?: boolean;
  isSchemaError?: boolean;
  isSyntaxError?: boolean;
  onRetry?: () => void;
  cardNumber?: string | null;
}

const SearchErrorDisplay: React.FC<SearchErrorDisplayProps> = ({ 
  error, 
  isTimeout = false,
  isJsonError = false,
  isSchemaError = false,
  isSyntaxError = false,
  onRetry,
  cardNumber
}) => {
  if (!error) return null;
  
  let Icon = AlertCircle;
  let title = 'Search Error';
  let message = error;
  let helpText = 'Please try again with different search criteria.';
  
  // Determine the icon and message based on the error type
  if (isTimeout) {
    Icon = Clock;
    title = 'Search Timeout';
    helpText = 'Try a more specific search to narrow down the results.';
  } else if (isJsonError || isSchemaError) {
    Icon = Database;
    title = 'Database Error';
    message = 'We encountered a technical issue while searching the database.';
    helpText = 'Our team is working to fix this. Please try again shortly.';
  } else if (isSyntaxError) {
    Icon = Code;
    title = 'Query Syntax Error';
    message = 'There was a problem with the search query syntax.';
    helpText = 'Try searching with simpler terms or a different format.';
    
    // Add special help for card number syntax issues
    if (cardNumber) {
      helpText = `Try searching by name or set instead of card number "${cardNumber}".`;
    }
  }

  return (
    <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
      <div className="flex items-start">
        <div className="p-1.5 bg-red-100 rounded-full mr-3 mt-0.5">
          <Icon className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <p className="mt-1 text-xs text-red-600">{helpText}</p>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-xs font-medium flex items-center text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchErrorDisplay;
