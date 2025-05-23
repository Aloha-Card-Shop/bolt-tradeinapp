
import React from 'react';
import { Search, Loader } from 'lucide-react';

interface CertificateSearchInputProps {
  certNumber: string;
  onCertNumberChange: (value: string) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
}

const CertificateSearchInput: React.FC<CertificateSearchInputProps> = ({
  certNumber,
  onCertNumberChange,
  onSearch,
  onKeyDown,
  isLoading
}) => {
  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={certNumber}
        onChange={(e) => onCertNumberChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Enter PSA certificate number..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        onClick={onSearch}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default CertificateSearchInput;
