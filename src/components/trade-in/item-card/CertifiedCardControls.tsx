
import React from 'react';
import QuantityInput from '../shared/QuantityInput';
import PaymentTypeSelector from '../shared/PaymentTypeSelector';
import { ExternalLink } from 'lucide-react';
import { PriceSource } from '../../../types/card';

interface CertifiedCardControlsProps {
  quantity: number;
  paymentType: 'cash' | 'trade' | null;
  isLoadingPrice?: boolean;
  onQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentTypeChange: (type: 'cash' | 'trade') => void;
  grade?: string;
  priceSource?: PriceSource;
}

const CertifiedCardControls: React.FC<CertifiedCardControlsProps> = ({
  quantity,
  paymentType,
  isLoadingPrice,
  onQuantityChange,
  onPaymentTypeChange,
  grade,
  priceSource
}) => {
  return (
    <div className="mt-4">
      <div className="mb-3">
        <div className="bg-blue-50 text-blue-700 rounded-md p-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium">PSA Grade</span>
            <div className="font-bold text-lg">{grade || 'N/A'}</div>
          </div>
          <div className="bg-white px-3 py-1 rounded-full text-blue-600 font-bold border border-blue-200">
            Certified
          </div>
        </div>
        
        {priceSource && (
          <div className="mt-2 text-xs">
            <a 
              href={priceSource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <span>
                {priceSource.foundSales 
                  ? `Based on ${priceSource.salesCount || 0} sales from ${priceSource.name}`
                  : `View on ${priceSource.name}`
                }
              </span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <QuantityInput
          quantity={quantity}
          onChange={onQuantityChange}
          disabled={isLoadingPrice}
        />

        <PaymentTypeSelector
          paymentType={paymentType}
          onSelect={onPaymentTypeChange}
          disabled={isLoadingPrice}
        />
      </div>
    </div>
  );
};

export default CertifiedCardControls;
