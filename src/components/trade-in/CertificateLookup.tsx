
import React, { useState } from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import { useEbayPriceLookup } from '../../hooks/useEbayPriceLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle, Bug, Code, FileText, Terminal, Plus } from 'lucide-react';
import { CardDetails } from '../../types/card';

interface CertificateLookupProps {
  onCertificateFound: (card: any) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCertificateFound }) => {
  const [lookupMode, setLookupMode] = useState<'psa' | 'manual'>('psa');
  const [manualCardData, setManualCardData] = useState({
    company: 'BGS',
    cardName: '',
    set: '',
    cardNumber: '',
    grade: '',
    year: ''
  });

  const {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    handleCertLookup,
    handleKeyDown,
    certifiedCard,
    priceData
  } = useCertificateLookup();

  const { lookupPrice, isLoading: isManualLoading, priceData: manualPriceData, error: manualError } = useEbayPriceLookup();
  
  // State to toggle debug info visibility
  const [showDebug, setShowDebug] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showProcess, setShowProcess] = useState(false);

  // Effect to add the certified card to search results when found
  React.useEffect(() => {
    if (certifiedCard) {
      onCertificateFound(certifiedCard);
    }
  }, [certifiedCard, onCertificateFound]);

  // Handle manual card entry and search
  const handleManualSearch = async () => {
    if (!manualCardData.cardName.trim()) {
      return;
    }

    // Create a CardDetails object for the manual entry
    const manualCard: CardDetails = {
      id: `manual-${Date.now()}`,
      name: manualCardData.cardName,
      set: manualCardData.set,
      number: manualCardData.cardNumber || undefined,
      rarity: undefined,
      imageUrl: null,
      game: 'pokemon',
      isCertified: true,
      certification: {
        certNumber: `${manualCardData.company}-Manual-Entry`,
        grade: manualCardData.grade,
        certificationDate: new Date().toISOString(),
        certifier: manualCardData.company
      }
    };

    // Look up eBay prices
    await lookupPrice(manualCard);
    
    // Add to results
    onCertificateFound(manualCard);
  };

  // Format timestamps for better readability
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  const currentPriceData = lookupMode === 'psa' ? priceData : manualPriceData;
  const currentError = lookupMode === 'psa' ? error : manualError;

  return (
    <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-medium mb-3">Graded Card Lookup</h3>
      
      {/* Mode selector */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setLookupMode('psa')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              lookupMode === 'psa' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            PSA Certificate
          </button>
          <button
            onClick={() => setLookupMode('manual')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              lookupMode === 'manual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manual Entry (BGS, CGC, etc.)
          </button>
        </div>
      </div>

      {lookupMode === 'psa' ? (
        <>
          <CertificateSearchInput
            certNumber={certNumber}
            onCertNumberChange={setCertNumber}
            onSearch={handleCertLookup}
            onKeyDown={handleKeyDown}
            isLoading={isLoading}
          />
          
          <div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Enter a PSA certification number to look up graded cards. 
              Example numbers: 49392223, 82674292, 25777273
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grading Company
              </label>
              <select
                value={manualCardData.company}
                onChange={(e) => setManualCardData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BGS">BGS (Beckett)</option>
                <option value="CGC">CGC</option>
                <option value="SGC">SGC</option>
                <option value="GMA">GMA</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <input
                type="text"
                value={manualCardData.grade}
                onChange={(e) => setManualCardData(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g., 9.5, 10, Mint"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Name *
            </label>
            <input
              type="text"
              value={manualCardData.cardName}
              onChange={(e) => setManualCardData(prev => ({ ...prev, cardName: e.target.value }))}
              placeholder="e.g., Charizard, Ursaring"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                value={manualCardData.year}
                onChange={(e) => setManualCardData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="e.g., 2023"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set
              </label>
              <input
                type="text"
                value={manualCardData.set}
                onChange={(e) => setManualCardData(prev => ({ ...prev, set: e.target.value }))}
                placeholder="e.g., Skyridge"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={manualCardData.cardNumber}
                onChange={(e) => setManualCardData(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="e.g., #110"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleManualSearch}
            disabled={isManualLoading || !manualCardData.cardName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isManualLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Searching eBay...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Results & Search eBay
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Example: BGS 2023 Skyridge #110 Ursaring BGS 9.5 - This will search eBay for pricing data.
            </span>
          </div>
        </div>
      )}
      
      {/* Show errors */}
      {currentError && <CertificateError error={currentError} />}
      
      {/* Show price query info if available */}
      {currentPriceData && (
        <div className="mt-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-gray-700">
              <strong>Search query:</strong> "{currentPriceData.query || 'Unknown'}"
            </div>
            
            <div className="flex gap-2">
              {currentPriceData.debug?.processSteps && (
                <button
                  onClick={() => setShowProcess(!showProcess)}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-xs"
                  title="Toggle process steps"
                >
                  <Terminal className="h-3.5 w-3.5 mr-1" />
                  {showProcess ? 'Hide Process' : 'Show Process'}
                </button>
              )}
            
              {currentPriceData.htmlSnippet && (
                <button
                  onClick={() => setShowHtml(!showHtml)}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-xs"
                  title="Toggle HTML snippet"
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  {showHtml ? 'Hide HTML' : 'Show HTML'}
                </button>
              )}
              
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center text-gray-500 hover:text-gray-700 text-xs"
                title="Toggle debug information"
              >
                <Bug className="h-3.5 w-3.5 mr-1" />
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
          
          {!currentPriceData.filteredSalesCount && (
            <p className="text-xs text-gray-500 mt-1">
              No recent sales found through automatic search
            </p>
          )}
          
          {/* Show search query and results statistics */}
          {currentPriceData.filteredSalesCount && currentPriceData.filteredSalesCount > 0 && (
            <p className="text-xs text-green-600 mt-1">
              <strong>Found:</strong> {currentPriceData.filteredSalesCount} recent sales (from total {currentPriceData.salesCount})
            </p>
          )}

          {/* Show submission URL if available */}
          {currentPriceData.debug?.formSubmitUrl && (
            <p className="text-xs text-gray-600 mt-1">
              <strong>Form URL:</strong> {currentPriceData.debug.formSubmitUrl}
            </p>
          )}
          
          {/* Show page title if available */}
          {currentPriceData.pageTitle && (
            <p className="text-xs text-gray-600 mt-1">
              <strong>Page title:</strong> {currentPriceData.pageTitle}
            </p>
          )}
          
          {/* Show timestamp if available */}
          {currentPriceData.timestamp && (
            <p className="text-xs text-gray-600 mt-1">
              <strong>Last updated:</strong> {formatTimestamp(currentPriceData.timestamp)}
            </p>
          )}
          
          {/* Process steps section */}
          {showProcess && currentPriceData.debug?.processSteps && (
            <div className="mt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center">
                <Terminal className="h-4 w-4 mr-1" />
                Process Steps
              </h4>
              
              <div className="p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-gray-200">
                <ol className="list-decimal pl-5 space-y-1">
                  {currentPriceData.debug.processSteps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              
              {/* Show errors if any */}
              {currentPriceData.debug.errors && currentPriceData.debug.errors.length > 0 && (
                <div className="p-2 bg-red-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-red-200">
                  <h5 className="font-semibold text-red-600 mb-1">Errors:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {currentPriceData.debug.errors.map((err: string, index: number) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* HTML snippet section */}
          {showHtml && currentPriceData.htmlSnippet && (
            <div className="mt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                HTML Snippet
              </h4>
              
              <div className="p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-gray-200">
                {currentPriceData.htmlSnippet}
              </div>
            </div>
          )}
          
          {/* Debug information section */}
          {showDebug && currentPriceData.debug && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <h4 className="font-bold mb-1">Debug Info:</h4>
              
              {/* Full debug data */}
              <pre className="whitespace-pre-wrap break-words mt-2">
                {JSON.stringify(currentPriceData.debug, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateLookup;
