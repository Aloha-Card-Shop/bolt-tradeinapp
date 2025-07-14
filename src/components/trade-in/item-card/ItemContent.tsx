
import React from 'react';
import { TradeInItem } from '../../../hooks/useTradeInList';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import WarningMessages from './WarningMessages';
import DebugPanel from './DebugPanel';
import CertifiedCardControls from './CertifiedCardControls';
import { VariantAvailability } from '../../../services/variantAvailabilityService';

interface ItemContentProps {
  item: TradeInItem;
  displayValue: number;
  isCalculating: boolean;
  error?: string;
  updateQuantity: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleFirstEdition: () => void;
  toggleHolo: () => void;
  toggleReverseHolo: () => void;
  updatePaymentType: (type: 'cash' | 'trade') => void;
  onValueAdjustment?: (valueType: 'cash' | 'trade', value: number) => void;
  onMarketPriceChange?: (price: number) => void;
  isDebugMode: boolean;
  debugInfo: {
    price: number;
    cashValue: number;
    tradeValue: number;
    game: string;
    paymentType: string;
    initialCalculation: string;
    error?: string;
  };
  hideDetailedPricing?: boolean;
  availability?: VariantAvailability;
  isLoadingAvailability?: boolean;
}

const ItemContent: React.FC<ItemContentProps> = ({
  item,
  displayValue,
  isCalculating,
  error,
  updateQuantity,
  toggleFirstEdition,
  toggleHolo,
  toggleReverseHolo,
  updatePaymentType,
  onValueAdjustment,
  onMarketPriceChange,
  isDebugMode,
  debugInfo,
  hideDetailedPricing = false,
  availability,
  isLoadingAvailability
}) => {
  // Check if the card is certified (PSA card)
  const isCertified = item.card.isCertified;
  const certificationGrade = item.card.certification?.grade;
  const priceSource = item.card.priceSource;

  return (
    <>
      {isCertified ? (
        // Render simplified controls for certified cards
        <CertifiedCardControls
          quantity={item.quantity}
          paymentType={item.paymentType}
          isLoadingPrice={item.isLoadingPrice}
          onQuantityChange={updateQuantity}
          onPaymentTypeChange={updatePaymentType}
          grade={certificationGrade}
          priceSource={priceSource}
        />
      ) : (
        // Render normal controls for regular cards
        <ItemControls
          quantity={item.quantity}
          isFirstEdition={item.isFirstEdition}
          isHolo={item.isHolo}
          isReverseHolo={item.isReverseHolo || false}
          paymentType={item.paymentType}
          isLoadingPrice={item.isLoadingPrice}
          onQuantityChange={updateQuantity}
          onToggleFirstEdition={toggleFirstEdition}
          onToggleHolo={toggleHolo}
          onToggleReverseHolo={toggleReverseHolo}
          onPaymentTypeChange={updatePaymentType}
          availability={availability}
          isLoadingAvailability={isLoadingAvailability}
        />
      )}

      <ItemValues
        price={item.price}
        paymentType={item.paymentType}
        displayValue={displayValue}
        isLoading={isCalculating}
        isLoadingPrice={item.isLoadingPrice}
        error={error || item.error}
        isPriceUnavailable={item.isPriceUnavailable}
        onValueAdjustment={onValueAdjustment}
        onMarketPriceChange={onMarketPriceChange}
        usedFallback={item.usedFallback}
        fallbackReason={item.fallbackReason}
        isCertified={isCertified}
        priceSource={priceSource}
        hideDetailedPricing={hideDetailedPricing}
        marketPriceManuallySet={item.marketPriceManuallySet}
      />
      
      <WarningMessages 
        card={item.card}
        price={item.price}
      />
      
      {/* Only show debug panel if explicitly enabled and not hiding detailed pricing */}
      {!hideDetailedPricing && (
        <DebugPanel 
          isVisible={isDebugMode}
          debugInfo={debugInfo}
        />
      )}
    </>
  );
};

export default ItemContent;
