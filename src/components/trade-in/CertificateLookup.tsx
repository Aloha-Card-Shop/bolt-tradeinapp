
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle, Bug, Code, FileText, Terminal } from 'lucide-react';

interface CertificateLookupProps {
  onCertificateFound: (card: any) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCertificateFound }) => {
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
  
  // State to toggle debug info visibility
  const [showDebug, setShowDebug] = React.useState(false);
  
  // State to toggle HTML snippet visibility
  const [showHtml, setShowHtml] = React.useState(false);
  
  // State to toggle process steps visibility
  const [showProcess, setShowProcess] = React.useState(false);

  // Effect to add the certified card to search results when found
  React.useEffect(() => {
    if (certifiedCard) {
      // Send the certificate card to search results instead of directly to trade-in list
      onCertificateFound(certifiedCard);
    }
  }, [certifiedCard, onCertificateFound]);

  // Format timestamps for better readability
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-medium mb-3">Certificate Lookup</h3>
      
      <CertificateSearchInput
        certNumber={certNumber}
        onCertNumberChange={setCertNumber}
        onSearch={handleCertLookup}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
      />
      
      {/* Only show certificate lookup errors, not price lookup errors */}
      {error && <CertificateError error={error} />}
      
      {/* Show price query info if available even when no price found */}
      {priceData && (
        <div className="mt-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-gray-700">
              <strong>Search query:</strong> "{priceData.query || 'Unknown'}"
            </div>
            
            <div className="flex gap-2">
              {priceData.debug?.processSteps && (
                <button
                  onClick={() => setShowProcess(!showProcess)}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-xs"
                  title="Toggle process steps"
                >
                  <Terminal className="h-3.5 w-3.5 mr-1" />
                  {showProcess ? 'Hide Process' : 'Show Process'}
                </button>
              )}
            
              {priceData.htmlSnippet && (
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
          
          {!priceData.filteredSalesCount && (
            <p className="text-xs text-gray-500 mt-1">
              No recent sales found through automatic search
            </p>
          )}
          
          {/* Show search query and results statistics */}
          {priceData.filteredSalesCount > 0 && (
            <p className="text-xs text-green-600 mt-1">
              <strong>Found:</strong> {priceData.filteredSalesCount} recent sales (from total {priceData.salesCount})
            </p>
          )}
          
          {/* Show page title if available */}
          {priceData.pageTitle && (
            <p className="text-xs text-gray-600 mt-1">
              <strong>Page title:</strong> {priceData.pageTitle}
            </p>
          )}
          
          {/* Show timestamp if available */}
          {priceData.timestamp && (
            <p className="text-xs text-gray-600 mt-1">
              <strong>Last updated:</strong> {formatTimestamp(priceData.timestamp)}
            </p>
          )}
          
          {/* Process steps section */}
          {showProcess && priceData.debug?.processSteps && (
            <div className="mt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center">
                <Terminal className="h-4 w-4 mr-1" />
                Process Steps
              </h4>
              
              <div className="p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-gray-200">
                <ol className="list-decimal pl-5 space-y-1">
                  {priceData.debug.processSteps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              
              {/* Show errors if any */}
              {priceData.debug.errors && priceData.debug.errors.length > 0 && (
                <div className="p-2 bg-red-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-red-200">
                  <h5 className="font-semibold text-red-600 mb-1">Errors:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-red-600">
                    {priceData.debug.errors.map((err: string, index: number) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* HTML snippet section */}
          {showHtml && priceData.htmlSnippet && (
            <div className="mt-3 space-y-3">
              <h4 className="text-sm font-semibold flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                HTML Snippet
              </h4>
              
              <div className="p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words border border-gray-200">
                {priceData.htmlSnippet}
              </div>
            </div>
          )}
          
          {/* Debug information section */}
          {showDebug && priceData.debug && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <h4 className="font-bold mb-1">Debug Info:</h4>
              
              {/* Full debug data */}
              <pre className="whitespace-pre-wrap break-words mt-2">
                {JSON.stringify(priceData.debug, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Enter a PSA certification number to look up graded cards. 
          Example numbers: 49392223, 82674292, 25777273
        </span>
      </div>
    </div>
  );
};

export default CertificateLookup;
