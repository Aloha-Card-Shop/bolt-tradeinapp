
import React, { useState } from 'react';
import { Loader2, Award, DollarSign, PlusCircle, AlertCircle, Trash2 } from 'lucide-react';
import { CardDetails } from '../types/card';
import { formatCurrency } from '../utils/formatters';
import SalesDataBreakdown from './trade-in/SalesDataBreakdown';

interface GradedCardResultsProps {
  results: CardDetails[];
  isLoading: boolean;
  onAddToList: (card: CardDetails, condition: string, price: number) => void;
  onRemoveCard?: (card: CardDetails) => void;
}

const GradedCardResults: React.FC<GradedCardResultsProps> = ({ 
  results, 
  isLoading, 
  onAddToList,
  onRemoveCard
}) => {
  const [expandedSalesData, setExpandedSalesData] = useState<Set<string>>(new Set());
  const [adjustedPrices, setAdjustedPrices] = useState<Map<string, number>>(new Map());

  // Toggle sales data expansion
  const toggleSalesData = (cardId: string) => {
    setExpandedSalesData(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Handle adjusted price changes from sales selection
  const handleAdjustedPriceChange = (cardId: string, newPrice: number) => {
    setAdjustedPrices(prev => {
      const newMap = new Map(prev);
      newMap.set(cardId, newPrice);
      return newMap;
    });
  };

  // Function to handle adding card to the trade-in list
  const handleAddToList = (card: CardDetails) => {
    if (!card.productId) {
      console.error("Card missing productId:", card);
      return;
    }
    
    const cardId = `${card.name}-${card.productId || card.certification?.certNumber}`;
    const adjustedPrice = adjustedPrices.get(cardId);
    
    if (adjustedPrice && adjustedPrice > 0) {
      onAddToList(card, 'certified', adjustedPrice);
    } else {
      // Use grade-based pricing as fallback
      const gradeValue = parseFloat(card.certification?.grade || '0');
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
      
      onAddToList(card, 'certified', defaultPrice);
    }
  };

  // Function to handle removing card from results
  const handleRemoveCard = (card: CardDetails) => {
    if (onRemoveCard) {
      onRemoveCard(card);
    }
  };

  if (isLoading && results.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Looking up certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Award className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="ml-3 text-xl font-semibold text-gray-800">
            Graded Cards
            {results.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({results.length} found)
              </span>
            )}
          </h2>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="p-8 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Enter a PSA certificate number to look up graded cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.map((card, index) => {
            const cardId = `${card.name}-${card.productId || index}`;
            const isExpanded = expandedSalesData.has(cardId);
            const adjustedPrice = adjustedPrices.get(cardId);
            const displayPrice = adjustedPrice || card.lastPrice;
            const hasProductId = Boolean(card.productId);
            
            return (
              <div 
                key={cardId}
                className="bg-white rounded-xl border border-blue-200 p-4 hover:border-blue-300 hover:shadow-md transition duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Award className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{card.name}</h3>
                        {card.set && (
                          <p className="text-sm text-gray-600 mt-1">{card.set}</p>
                        )}
                        
                        {/* PSA Grade Display */}
                        {card.certification && (
                          <div className="bg-blue-50 text-blue-700 rounded-md px-2 py-1 mt-2 inline-flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            <span className="text-xs font-medium">
                              PSA {card.certification.grade} | #{card.certification.certNumber}
                            </span>
                          </div>
                        )}
                        
                        {/* Price information */}
                        {card.priceSource && (
                          <div className="mt-2">
                            {displayPrice && displayPrice > 0 ? (
                              <div className={`mt-1 p-2 border rounded-md flex items-center ${
                                adjustedPrice ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'
                              }`}>
                                <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">
                                    {adjustedPrice ? 'Adjusted average' : 'Average price'}: ${formatCurrency(displayPrice)}
                                    {adjustedPrice && (
                                      <span className="text-xs ml-1">(was ${formatCurrency(card.lastPrice || 0)})</span>
                                    )}
                                  </p>
                                  <p className="text-xs">Based on {card.priceSource.salesCount || 0} recent sales</p>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                                <p className="font-medium">No recent sales data found</p>
                                {card.priceSource.url && (
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
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sales Data Breakdown */}
                        {card.priceSource && card.priceSource.soldItems && card.priceSource.soldItems.length > 0 && (
                          <SalesDataBreakdown
                            soldItems={card.priceSource.soldItems}
                            averagePrice={card.lastPrice || 0}
                            priceRange={card.priceSource.priceRange || { min: 0, max: 0 }}
                            outliersRemoved={card.priceSource.outliersRemoved || 0}
                            calculationMethod={card.priceSource.calculationMethod || 'unknown'}
                            searchUrl={card.priceSource.url || ''}
                            query={card.priceSource.query || ''}
                            salesCount={card.priceSource.salesCount || 0}
                            isExpanded={isExpanded}
                            onToggle={() => toggleSalesData(cardId)}
                            onAdjustedPriceChange={(newPrice) => handleAdjustedPriceChange(cardId, newPrice)}
                          />
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
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRemoveCard(card)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                          title="Remove from results"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GradedCardResults;
