
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CertificateErrorProps {
  error: string;
}

const CertificateError: React.FC<CertificateErrorProps> = ({ error }) => {
  return (
    <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 mb-3">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm">{error}</span>
    </div>
  );
};

export default CertificateError;
