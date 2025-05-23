
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateResultCard from './certificate/CertificateResultCard';
import CertificateError from './certificate/CertificateError';
import { CardDetails } from '../../types/card';
import { AlertCircle } from 'lucide-react';

interface CertificateLookupProps {
  onCardFound: (card: CardDetails, price: number) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCardFound }) => {
  const {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    result,
    handleCertLookup,
    handleAddToTradeIn,
    handleKeyDown
  } = useCertificateLookup(onCardFound);

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
      
      {error && <CertificateError error={error} />}
      
      {result && <CertificateResultCard result={result} onAddToTradeIn={handleAddToTradeIn} />}
      
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
