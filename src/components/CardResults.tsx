import React, { useEffect, useRef, useCallback } from 'react';
import { Loader2, ImageOff, PlusCircle, Search, AlertCircle, Info, Award, DollarSign } from 'lucide-react';
import { CardDetails, SavedCard, CardNumberObject } from '../types/card';
import { extractNumberBeforeSlash, getCardNumberString } from '../utils/cardSearchUtils';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

interface CardResultsProps {
  results: CardDetails[];
  isLoading: boolean;
  onAddToList: (card: CardDetails | SavedCard, price: number) => void;
  hasMoreResults?: boolean;
  loadMoreResults?: () => void;
  totalResults?: number;
}

const CardResults: React.FC<CardResultsProps> = ({ 
  results, 
  isLoading, 
  onAddToList,
  hasMoreResults = false,
  loadMoreResults = () => {},
  totalResults = 0
}) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
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

  // Helper function to display card number with pre-slash highlight
  const renderCardNumber = (cardNumber: string | CardNumberObject | undefined) => {
    if (!cardNumber) return null;
    
    const fullNumber = getCardNumberString(cardNumber);
    const beforeSlash = extractNumberBeforeSlash(cardNumber);
    
    // If there's no slash, just show the number
    if (fullNumber === beforeSlash || !fullNumber.includes('/')) {
      return <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{fullNumber}</span>;
    }
    
    // Otherwise, highlight the part before the slash
    return (
      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded flex items-center">
        #<span className="font-medium text-blue-600">{beforeSlash}</span>
        <span className="text-gray-500">{fullNumber.substring(beforeSlash.length)}</span>
      </span>
    );
  };

  // Function to handle adding card to the trade-in list
  const handleAddToList = (card: CardDetails) => {
    // Enhanced product ID checking with better error messages
    if (!card.productId) {
      console.error("Card missing productId:", card);
      toast.error(`Cannot add "${card.name}" - Missing product ID`);
      return;
    }
    
    console.log("Adding card with productId:", card.productId, card);
    
    // For certified cards, use grade-based pricing
    if (card.isCertified && card.certification?.grade) {
      const gradeValue = parseFloat(card.certification.grade || '0');
      let defaultPrice = 0;
      
      if (gradeValue >= 9.5) {
        defaultPrice = 100; // Gem Mint estimate
      } else if (gradeValue >= 9) {
        defaultPrice = 50;  // Mint estimate
      } else if (gradeValue >= 8) {
        defaultPrice = 25;  // Near Mint estimate
      } else {
        defaultPrice = 10;  // Lower grades estimate
      }
      
      onAddToList(card, defaultPrice);
    } else {
      onAddToList(card, 0);
    }
  };

  if (isLoading && results.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Searching cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Search className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="ml-3 text-xl font-semibold text-gray-800">
            Search Results
            {results.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({results.length}{totalResults > results.length ? ` of ${totalResults}` : ''})
              </span>
            )}
          </h2>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Start typing to search for cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.map((card, index) => {
            // Add ref to last element for infinite scrolling
            const isLastElement = index === results.length - 1;
            const hasProductId = Boolean(card.productId);
            const isCertified = Boolean(card.isCertified);
              
            return (
              <div 
                key={`${card.name}-${card.productId || index}`}
                className={`bg-white rounded-xl border ${isCertified ? 'border-blue-200' : hasProductId ? 'border-gray-200' : 'border-red-200'} p-4 hover:border-blue-200 hover:shadow-md transition duration-200`}
                ref={isLastElement ? lastCardElementRef : null}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageOff className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {card.name}
                          {card.number && (
                            <span className="ml-2">
                              {renderCardNumber(card.number)}
                            </span>
                          )}
                        </h3>
                        {card.set && (
                          <p className="text-sm text-gray-600 mt-1">{card.set}</p>
                        )}
                        
                        {/* Special display for certified cards */}
                        {isCertified && card.certification && (
                          <div className="bg-blue-50 text-blue-700 rounded-md px-2 py-1 mt-1 inline-flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            <span className="text-xs font-medium">
                              PSA {card.certification.grade} | #{card.certification.certNumber}
                            </span>
                          </div>
                        )}
                        
                        {/* Price information with conditional display for certified cards */}
                        {isCertified && card.priceSource && (
                          <div className="mt-2">
                            {card.lastPrice ? (
                              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center">
                                <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">Average price: ${formatCurrency(card.lastPrice)}</p>
                                  <p className="text-xs">Based on {card.priceSource.salesCount} recent sales</p>
                                </div>
                              </div>
                            ) : card.priceSource.url && (
                              <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                                <p className="font-medium">No recent sales data found</p>
                                <p className="text-xs">
                                  <a 
                                    href={card.priceSource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View on {card.priceSource.name} for more information
                                  </a>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {card.productId ? (
                          <p className="text-xs text-gray-400 mt-1">ID: {card.productId}</p>
                        ) : (
                          <div className="flex items-center text-xs text-red-600 mt-1 font-medium">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Missing product ID
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToList(card)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          hasProductId 
                            ? 'text-gray-400 hover:text-green-500 hover:bg-green-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        disabled={!hasProductId}
                        title={hasProductId ? "Add to trade-in list" : "Cannot add - missing product ID"}
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
          {results.some(card => !card.productId) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-xs">
                Some cards are missing product IDs and cannot be added to your trade-in list. Try searching by card number instead.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardResults;
