
import React from 'react';
import { ExternalLink, ChevronUp, ChevronDown, Info, TrendingUp, AlertTriangle, RefreshCw, Check, X, CheckSquare, Square } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useSalesSelection } from '../../hooks/useSalesSelection';

interface SoldItem {
  title: string;
  price: number;
  url: string;
  isOutlier?: boolean;
}

interface SalesDataBreakdownProps {
  soldItems: SoldItem[];
  averagePrice: number;
  priceRange: { min: number; max: number };
  outliersRemoved: number;
  calculationMethod: string;
  searchUrl: string;
  query: string;
  salesCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAdjustedPriceChange?: (newPrice: number) => void;
}

const SalesDataBreakdown: React.FC<SalesDataBreakdownProps> = ({
  soldItems,
  averagePrice,
  priceRange,
  calculationMethod,
  searchUrl,
  query,
  salesCount,
  isExpanded,
  onToggle,
  onAdjustedPriceChange
}) => {
  const {
    adjustedCalculation,
    toggleItemInclusion,
    includeAllItems,
    excludeAllItems,
    resetToOriginal,
    isAdjusted,
    isItemIncluded
  } = useSalesSelection(soldItems);

  // Notify parent component of price changes
  React.useEffect(() => {
    if (onAdjustedPriceChange && isAdjusted) {
      onAdjustedPriceChange(adjustedCalculation.averagePrice);
    } else if (onAdjustedPriceChange && !isAdjusted) {
      onAdjustedPriceChange(averagePrice);
    }
  }, [adjustedCalculation.averagePrice, isAdjusted, onAdjustedPriceChange, averagePrice]);

  // Sort items to show included first, then excluded
  const sortedItems = [...soldItems].sort((a, b) => {
    const aIndex = soldItems.findIndex(item => item === a);
    const bIndex = soldItems.findIndex(item => item === b);
    const aIncluded = isItemIncluded(aIndex);
    const bIncluded = isItemIncluded(bIndex);
    
    if (aIncluded && !bIncluded) return -1;
    if (!aIncluded && bIncluded) return 1;
    
    // Within included/excluded groups, show outliers last
    if (a.isOutlier && !b.isOutlier) return 1;
    if (!a.isOutlier && b.isOutlier) return -1;
    return 0;
  });

  const displayedAverage = isAdjusted ? adjustedCalculation.averagePrice : averagePrice;
  const displayedCount = isAdjusted ? adjustedCalculation.includedCount : salesCount;

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          View pricing details ({displayedCount} of {soldItems.length} used for average)
          {isAdjusted && <span className="ml-1 text-orange-600">(adjusted)</span>}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Pricing Summary */}
          <div className={`rounded-lg p-3 ${isAdjusted ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className={`font-medium ${isAdjusted ? 'text-orange-700' : 'text-blue-700'}`}>
                  {isAdjusted ? 'Adjusted Average' : 'Average Price'}
                </p>
                <p className={`text-lg font-bold ${isAdjusted ? 'text-orange-900' : 'text-blue-900'}`}>
                  ${formatCurrency(displayedAverage)}
                </p>
                {isAdjusted && (
                  <p className="text-xs text-gray-600 mt-1">
                    Original: ${formatCurrency(averagePrice)}
                  </p>
                )}
              </div>
              <div>
                <p className={`font-medium ${isAdjusted ? 'text-orange-700' : 'text-blue-700'}`}>Price Range</p>
                <p className={isAdjusted ? 'text-orange-900' : 'text-blue-900'}>
                  ${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {adjustedCalculation.includedCount} included, {adjustedCalculation.excludedCount} excluded
                </p>
              </div>
            </div>
            
            {isAdjusted && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center text-xs text-orange-600">
                  <Info className="h-3 w-3 mr-1" />
                  You've manually adjusted which sales to include
                </div>
                <button
                  onClick={resetToOriginal}
                  className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset to Original
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Bulk actions:</span>
            <button
              onClick={includeAllItems}
              className="flex items-center px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors"
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              Include All
            </button>
            <button
              onClick={excludeAllItems}
              className="flex items-center px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"
            >
              <Square className="h-3 w-3 mr-1" />
              Exclude All
            </button>
          </div>

          {/* Individual Sales */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Sales Data:</h4>
            {sortedItems.length > 0 ? (
              <div className="space-y-2">
                {sortedItems.map((item, index) => {
                  const originalIndex = soldItems.findIndex(original => 
                    original.title === item.title && original.price === item.price && original.url === item.url
                  );
                  const isIncluded = isItemIncluded(originalIndex);
                  
                  return (
                    <div 
                      key={`${item.title}-${item.price}-${index}`}
                      className={`rounded-lg p-3 text-sm transition-all border ${
                        isIncluded
                          ? item.isOutlier
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-3">
                          <div className="flex items-start gap-2">
                            <p className={`font-medium line-clamp-2 mb-1 ${
                              !isIncluded ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {item.isOutlier && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  isIncluded 
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                                  Outlier
                                </span>
                              )}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                isIncluded
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isIncluded ? (
                                  <>
                                    <Check className="h-3 w-3 mr-0.5" />
                                    Included
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3 w-3 mr-0.5" />
                                    Excluded
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <button
                              onClick={() => toggleItemInclusion(originalIndex)}
                              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                isIncluded
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isIncluded ? 'Exclude from calculation' : 'Include in calculation'}
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold ${
                            !isIncluded ? 'text-gray-600' : 'text-green-600'
                          }`}>
                            ${formatCurrency(item.price)}
                          </p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center mt-1"
                            >
                              View <ExternalLink className="h-3 w-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No recent sales data available</p>
            )}
          </div>

          {/* User Control Explanation */}
          <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
            <div className="flex items-start">
              <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">About sales selection:</p>
                <p className="mt-1">
                  Outliers are automatically excluded by default. You have full control over which sales 
                  are included in the average calculation. Exclude sales that seem unusual (damaged cards, 
                  special circumstances, etc.) or include outliers you believe represent valid comparable sales. 
                  The average updates automatically to reflect your selections.
                </p>
              </div>
            </div>
          </div>

          {/* Search Information */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="mb-1">
              <span className="font-medium">Search Query:</span> {query}
            </p>
            <p className="mb-2">
              <span className="font-medium">Method:</span> {calculationMethod === 'outlier_trimmed_average' ? 'Outlier-trimmed average' : 'Simple average'}
              {isAdjusted && ' (manually adjusted)'}
            </p>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              View full eBay search results <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDataBreakdown;
