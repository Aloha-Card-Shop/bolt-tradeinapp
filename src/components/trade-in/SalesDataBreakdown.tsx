
import React from 'react';
import { ExternalLink, ChevronUp, ChevronDown, Info, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface SoldItem {
  title: string;
  price: number;
  url: string;
  endDate?: string;
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
  onToggle
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1" />
          View pricing details ({salesCount} recent sales)
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
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700 font-medium">Average Price</p>
                <p className="text-lg font-bold text-blue-900">${formatCurrency(averagePrice)}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Price Range</p>
                <p className="text-blue-900">${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}</p>
              </div>
            </div>
            
            {outliersRemoved > 0 && (
              <div className="mt-2 flex items-center text-xs text-blue-600">
                <Info className="h-3 w-3 mr-1" />
                {outliersRemoved} outlier(s) removed for better accuracy
              </div>
            )}
          </div>

          {/* Individual Sales */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Sales Data:</h4>
            {soldItems.length > 0 ? (
              <div className="space-y-2">
                {soldItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-3">
                        <p className="font-medium text-gray-900 line-clamp-2 mb-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          Sold: {formatDate(item.endDate)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600">${formatCurrency(item.price)}</p>
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No recent sales data available</p>
            )}
          </div>

          {/* Search Information */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="mb-1">
              <span className="font-medium">Search Query:</span> {query}
            </p>
            <p className="mb-2">
              <span className="font-medium">Method:</span> {calculationMethod === 'outlier_trimmed_average' ? 'Outlier-trimmed average' : 'Simple average'}
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
