
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle, ExternalLink, Bug } from 'lucide-react';

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

  // Effect to add the certified card to search results when found
  React.useEffect(() => {
    if (certifiedCard) {
      // Send the certificate card to search results instead of directly to trade-in list
      onCertificateFound(certifiedCard);
    }
  }, [certifiedCard, onCertificateFound]);

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
      
      {/* Show 130point.com search link if available even when no price found */}
      {priceData && priceData.searchUrl && (
        <div className="mt-3 text-sm">
          <div className="flex items-center justify-between">
            <a 
              href={priceData.searchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>View prices on 130point.com</span>
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center text-gray-500 hover:text-gray-700 text-xs"
              title="Toggle debug information"
            >
              <Bug className="h-3.5 w-3.5 mr-1" />
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          </div>
          
          {!priceData.filteredSalesCount && (
            <p className="text-xs text-gray-500 mt-1">
              No recent sales found through automatic search, but you can check manually
            </p>
          )}
          
          {/* Show search query used */}
          <p className="text-xs text-gray-600 mt-1">
            <strong>Search query:</strong> "{priceData.query || 'Unknown'}"
          </p>
          
          {/* Debug information section */}
          {showDebug && priceData.debug && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <h4 className="font-bold mb-1">Debug Info:</h4>
              <pre className="whitespace-pre-wrap break-words">
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
