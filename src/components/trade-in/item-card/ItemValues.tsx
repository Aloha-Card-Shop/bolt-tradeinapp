
import React, { useState } from 'react';
import ValueDisplay from '../shared/ValueDisplay';
import SalesDataBreakdown from '../SalesDataBreakdown';
import { PriceSource } from '../../../types/card';

interface ItemValuesProps {
  price: number;
  paymentType: 'cash' | 'trade' | null;
  displayValue: number;
  isLoading: boolean;
  isLoadingPrice?: boolean;
  error?: string;
  isPriceUnavailable?: boolean;
  onValueAdjustment?: (valueType: 'cash' | 'trade', value: number) => void;
  onMarketPriceChange?: (price: number) => void;
  usedFallback?: boolean;
  fallbackReason?: string;
  isCertified?: boolean;
  priceSource?: PriceSource;
  hideDetailedPricing?: boolean;
}

const ItemValues: React.FC<ItemValuesProps> = ({
  price,
  paymentType,
  displayValue,
  isLoading,
  isLoadingPrice,
  error,
  isPriceUnavailable,
  onValueAdjustment,
  onMarketPriceChange,
  usedFallback,
  fallbackReason,
  isCertified,
  priceSource,
  hideDetailedPricing = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getValueLabel = () => {
    if (!paymentType) return "Trade-In Value";
    if (paymentType === 'cash') return "Cash Value (Calculated)";
    return "Trade Credit Value";
  };

  return (
    <div className="mt-4 space-y-3">
      <ValueDisplay
        label="Market Price (Source)"
        value={price}
        isLoading={isLoadingPrice || false}
        error={isPriceUnavailable ? "Price unavailable" : undefined}
        onValueChange={onMarketPriceChange ? (valueType, value) => {
          console.log('ItemValues: Market price onValueChange called with:', { valueType, value });
          onMarketPriceChange(value);
        } : undefined}
        editable={!!onMarketPriceChange}
        valueType="cash"
      />
      
      <ValueDisplay
        label={getValueLabel()}
        value={displayValue}
        isLoading={isLoading}
        error={error}
        onValueChange={onValueAdjustment && paymentType === 'trade' ? onValueAdjustment : undefined}
        editable={!!onValueAdjustment && paymentType === 'trade'}
        usedFallback={usedFallback}
        fallbackReason={fallbackReason}
        valueType={paymentType || 'cash'}
      />

      {/* Only show sales data breakdown for certified cards if detailed pricing is not hidden */}
      {!hideDetailedPricing && isCertified && priceSource && priceSource.soldItems && priceSource.soldItems.length > 0 && (
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
