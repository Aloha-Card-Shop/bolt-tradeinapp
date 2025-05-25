
import React from 'react';
import { ExternalLink, ChevronUp, ChevronDown, Info, TrendingUp, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useOutlierSelection } from '../../hooks/useOutlierSelection';

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
  outliersRemoved,
  calculationMethod,
  searchUrl,
  query,
  salesCount,
  isExpanded,
  onToggle,
  onAdjustedPriceChange
}) => {
  const {
    includedOutliers,
    adjustedCalculation,
    toggleOutlierInclusion,
    resetToOriginal,
    isAdjusted
  } = useOutlierSelection(soldItems, averagePrice);

  // Notify parent component of price changes
  React.useEffect(() => {
    if (onAdjustedPriceChange && isAdjusted) {
      onAdjustedPriceChange(adjustedCalculation.averagePrice);
    } else if (onAdjustedPriceChange && !isAdjusted) {
      onAdjustedPriceChange(averagePrice);
    }
  }, [adjustedCalculation.averagePrice, isAdjusted, onAdjustedPriceChange, averagePrice]);

  // Sort items to show non-outliers first, then outliers
  const sortedItems = [...soldItems].sort((a, b) => {
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
          View pricing details ({displayedCount} used for average{outliersRemoved > 0 && `, ${outliersRemoved} outliers`})
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
                {isAdjusted && (
                  <p className="text-xs text-gray-600 mt-1">
                    {adjustedCalculation.includedCount} of {soldItems.length} items included
                  </p>
                )}
              </div>
            </div>
            
            {outliersRemoved > 0 && !isAdjusted && (
              <div className="mt-2 flex items-center text-xs text-blue-600">
                <Info className="h-3 w-3 mr-1" />
                {salesCount} items used for average, {outliersRemoved} outlier(s) excluded for accuracy
              </div>
            )}

            {isAdjusted && (
              <div className="mt-2 flex items-center justify-between">
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

          {/* Individual Sales */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Sales Data:</h4>
            {sortedItems.length > 0 ? (
              <div className="space-y-2">
                {sortedItems.map((item, index) => {
                  const originalIndex = soldItems.findIndex(original => 
                    original.title === item.title && original.price === item.price && original.url === item.url
                  );
                  const isIncluded = !item.isOutlier || includedOutliers.has(originalIndex);
                  
                  return (
                    <div 
                      key={`${item.title}-${item.price}-${index}`}
                      className={`rounded-lg p-3 text-sm transition-all ${
                        item.isOutlier 
                          ? isIncluded
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-red-50 border border-red-200 opacity-75'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-3">
                          <div className="flex items-start gap-2">
                            <p className={`font-medium line-clamp-2 mb-1 ${
                              item.isOutlier && !isIncluded ? 'text-gray-600' : 'text-gray-900'
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
                              {isIncluded && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-0.5" />
                                  Included
                                </span>
                              )}
                            </div>
                          </div>
                          {item.isOutlier && (
                            <div className="mt-1">
                              <button
                                onClick={() => toggleOutlierInclusion(originalIndex)}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                                  isIncluded
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {isIncluded ? 'Exclude from calculation' : 'Include in calculation'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold ${
                            item.isOutlier && !isIncluded ? 'text-gray-600' : 'text-green-600'
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

          {/* Outlier Explanation */}
          {outliersRemoved > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
              <div className="flex items-start">
                <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">About outlier detection and manual selection:</p>
                  <p className="mt-1">
                    Items marked as outliers were initially excluded from the average calculation to provide more accurate pricing. 
                    However, you can manually include any outlier you believe represents a valid comparable sale by clicking 
                    "Include in calculation" on that item. The average will update automatically to reflect your selections.
                  </p>
                </div>
              </div>
            </div>
          )}

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
