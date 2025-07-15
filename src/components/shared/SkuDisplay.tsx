import React from 'react';
import { parseSku, isGradedSku } from '../../utils/skuGenerator';

interface SkuDisplayProps {
  sku: string;
  showDetails?: boolean;
  className?: string;
}

const SkuDisplay: React.FC<SkuDisplayProps> = ({ 
  sku, 
  showDetails = false, 
  className = '' 
}) => {
  const skuData = parseSku(sku);
  const isGraded = isGradedSku(sku);

  if (!skuData) {
    return (
      <span className={`text-gray-500 ${className}`}>
        {sku}
      </span>
    );
  }

  return (
    <div className={className}>
      <span className={`font-mono text-sm ${isGraded ? 'text-purple-600' : 'text-blue-600'}`}>
        {sku}
      </span>
      {showDetails && (
        <div className="text-xs text-gray-500 mt-1">
          {isGraded ? (
            <div>
              <span className="font-semibold">Graded Card</span>
              <div>Cert: {skuData.certNumber}</div>
              <div>Grade: {skuData.grade}</div>
              <div>Condition: {skuData.conditionCode}</div>
            </div>
          ) : (
            <div>
              <span className="font-semibold">Ungraded Card</span>
              <div>TCG ID: {skuData.tcgplayerId}</div>
              <div>Edition: {skuData.editionHoloCode}</div>
              <div>Condition: {skuData.conditionCode}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkuDisplay;