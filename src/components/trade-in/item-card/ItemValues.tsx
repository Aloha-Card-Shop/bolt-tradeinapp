
import React, { useState } from 'react';
import ValueDisplay from '../shared/ValueDisplay';
import PriceInput from '../shared/PriceInput';
import SalesDataBreakdown from '../SalesDataBreakdown';
import { PriceSource } from '../../../types/card';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade' | null;
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice?: boolean;
  error?: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefreshPrice: () => void;
  isPriceUnavailable?: boolean;
  onValueAdjustment?: (value: number) => void;
  usedFallback?: boolean;
  fallbackReason?: string;
  isCertified?: boolean;
  priceSource?: PriceSource;
}

const ItemValues: React.FC<ItemValuesProps> = ({
  price,
  paymentType,
  displayValue,
  isLoading,
  isLoadingPrice,
  error,
  onPriceChange,
  onRefreshPrice,
  isPriceUnavailable,
  onValueAdjustment,
  usedFallback,
  fallbackReason,
  isCertified,
  priceSource
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getValueLabel = () => {
    if (!paymentType) return "Trade-In Value";
    return paymentType === 'cash' ? "Cash Value" : "Trade Credit Value";
  };

  return (
    <div className="mt-4 space-y-3">
      <PriceInput
        price={price}
        onChange={onPriceChange}
        onRefreshPrice={onRefreshPrice}
        isLoading={isLoadingPrice}
        isPriceUnavailable={isPriceUnavailable}
        usedFallback={usedFallback}
        fallbackReason={fallbackReason}
      />
      
      <ValueDisplay
        label={getValueLabel()}
        value={displayValue}
        isLoading={isLoading}
        error={error}
        onValueChange={onValueAdjustment}
        editable={!!onValueAdjustment}
        usedFallback={usedFallback}
        fallbackReason={fallbackReason}
      />

      {/* Show sales data breakdown for certified cards with price source */}
      {isCertified && priceSource && priceSource.soldItems && priceSource.soldItems.length > 0 && (
        <SalesDataBreakdown
          soldItems={priceSource.soldItems}
          averagePrice={price}
          priceRange={priceSource.priceRange || { min: 0, max: 0 }}
          outliersRemoved={priceSource.outliersRemoved || 0}
          calculationMethod={priceSource.calculationMethod || 'unknown'}
          searchUrl={priceSource.url}
          query={priceSource.query || ''}
          salesCount={priceSource.salesCount || 0}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />
      )}
    </div>
  );
};

export default ItemValues;
