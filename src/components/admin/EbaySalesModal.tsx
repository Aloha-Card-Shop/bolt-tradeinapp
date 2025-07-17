import { useState } from 'react';
import { X, ExternalLink, TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { useEbayPriceLookup } from '../../hooks/useEbayPriceLookup';
import { formatCurrency } from '../../utils/formatters';

interface EbaySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardSet: string | null;
  cardNumber: string | null;
  psaGrade?: string;
}

const EbaySalesModal = ({ isOpen, onClose, cardName, cardSet, cardNumber, psaGrade }: EbaySalesModalProps) => {
  const { isLoading, error, priceData, lookupPrice } = useEbayPriceLookup();
  const [hasLoaded, setHasLoaded] = useState(false);

  if (!isOpen) return null;

  // Load data when modal opens
  if (isOpen && !hasLoaded && !isLoading) {
    setHasLoaded(true);
    lookupPrice({
      name: cardName,
      set: cardSet || '',
      number: cardNumber || '',
      game: 'pokemon' // Assuming Pokemon for now
    });
  }

  const handleClose = () => {
    setHasLoaded(false);
    onClose();
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent eBay Sales</h2>
              <p className="text-sm text-gray-500">
                {cardName} {cardSet && `• ${cardSet}`} {cardNumber && `• #${cardNumber}`}
                {psaGrade && ` • PSA ${psaGrade}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading eBay sales data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Error loading sales data</span>
              </div>
              <p className="text-red-600 mt-1 text-sm">{error}</p>
            </div>
          )}

          {priceData && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Average Price</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(priceData.averagePrice)}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Sales Found</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {priceData.salesCount}
                  </div>
                </div>

              </div>

              {/* Sales List */}
              {priceData.soldItems && priceData.soldItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Sales ({priceData.soldItems.length})
                  </h3>
                  <div className="space-y-3">
                    {priceData.soldItems.map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border transition-all hover:shadow-sm bg-white border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-5">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                Recent Sale
                              </div>
                              {item.isOutlier && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Outlier
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(item.price)}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View on eBay"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* eBay Search Link - Always show */}
              <div className="text-center py-8 border-t border-gray-200">
                <p className="text-gray-600 mb-4">
                  Click below to view detailed sold listings on eBay for this card
                </p>

                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(
                    `${cardName} ${cardSet || ''} ${cardNumber || ''} ${psaGrade ? `PSA ${psaGrade}` : ''}`
                  )}&_in_kw=1&_ex_kw=&_sacat=0&_odkw=&_osacat=0&LH_Sold=1&LH_Complete=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ExternalLink className="h-5 w-5" />
                  View eBay Sold Listings
                </a>
              </div>
            </div>
          )}

          {!priceData && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Search</h3>
              <p className="text-gray-500 mb-4">
                eBay price lookup will show average selling price and market data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EbaySalesModal;