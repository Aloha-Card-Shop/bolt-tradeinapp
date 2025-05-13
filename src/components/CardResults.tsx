
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CardDetails, SavedCard } from '../types/card';

// Import our new components
import ResultsHeader from './card-search/ResultsHeader';
import CardResultItem from './card-search/CardResultItem';
import SearchErrorDisplay from './card-search/SearchErrorDisplay';
import NoResultsMessage from './card-search/NoResultsMessage';
import LoadingDisplay from './card-search/LoadingDisplay';
import ProductIdWarning from './card-search/ProductIdWarning';

interface CardResultsProps {
  results: CardDetails[];
  isLoading: boolean;
  onAddToList: (card: CardDetails | SavedCard, price: number) => void;
  hasMoreResults?: boolean;
  loadMoreResults?: () => void;
  totalResults?: number;
  error?: string | null;
  onRetrySearch?: () => void;
}

const CardResults: React.FC<CardResultsProps> = ({ 
  results, 
  isLoading, 
  onAddToList,
  hasMoreResults = false,
  loadMoreResults = () => {},
  totalResults = 0,
  error = null,
  onRetrySearch
}) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [errorType, setErrorType] = useState<string>('unknown');
  
  // Determine the type of error for better display
  useEffect(() => {
    if (error) {
      if (error.toLowerCase().includes('timeout')) {
        setErrorType('timeout');
      } else if (error.toLowerCase().includes('json') || error.toLowerCase().includes('jsonb')) {
        setErrorType('json');
      } else if (error.toLowerCase().includes('does not exist') || error.toLowerCase().includes('schema')) {
        setErrorType('schema');
      } else if (error.toLowerCase().includes('parse') || error.toLowerCase().includes('syntax')) {
        setErrorType('syntax');
      } else {
        setErrorType('unknown');
      }
    }
  }, [error]);
  
  // Setup intersection observer for infinite scrolling
  const lastCardElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && hasMoreResults) {
          loadMoreResults();
        }
      }, { threshold: 0.5 });
      
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMoreResults, loadMoreResults]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Show loading state when no results yet
  if (isLoading && results.length === 0) {
    return <LoadingDisplay />;
  }

  return (
    <div className="p-6">
      <ResultsHeader resultsCount={results.length} totalResults={totalResults} />

      {/* Display any search errors */}
      {error && (
        <SearchErrorDisplay 
          error={error}
          isTimeout={errorType === 'timeout'}
          isJsonError={errorType === 'json'}
          isSchemaError={errorType === 'schema'}
          isSyntaxError={errorType === 'syntax'}
          onRetry={onRetrySearch}
        />
      )}

      {/* Show no results message or results list */}
      {results.length === 0 && !error ? (
        <NoResultsMessage isSearchPerformed={false} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Map through results to display cards */}
          {results.map((card, index) => {
            const isLastElement = index === results.length - 1;
            
            return (
              <CardResultItem 
                key={`${card.name}-${card.productId || index}`}
                card={card}
                onAddToList={onAddToList}
                isLastElement={isLastElement}
                lastCardElementRef={lastCardElementRef}
              />
            );
          })}
          
          {/* Loading indicator for infinite scrolling */}
          {hasMoreResults && (
            <div 
              ref={loadMoreRef} 
              className="py-4 flex justify-center"
            >
              {isLoading && results.length > 0 ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                <p className="text-sm text-gray-500">Scroll for more results</p>
              )}
            </div>
          )}
          
          {/* Information message about product IDs */}
          {results.some(card => !card.productId) && <ProductIdWarning />}
        </div>
      )}
    </div>
  );
};

export default CardResults;
