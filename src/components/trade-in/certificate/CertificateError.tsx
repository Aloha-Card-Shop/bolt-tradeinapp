
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CertificateErrorProps {
  error: string;
}

const CertificateError: React.FC<CertificateErrorProps> = ({
  error
}) => {
  return (
    <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 text-red-600 rounded-md">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{error}</p>
    </div>
  );
};

export default CertificateError;
