
import React from 'react';

interface CertificateErrorProps {
  error: string;
}

const CertificateError: React.FC<CertificateErrorProps> = ({ error }) => {
  return (
    <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center mb-3">
      <span>{error}</span>
    </div>
  );
};

export default CertificateError;
