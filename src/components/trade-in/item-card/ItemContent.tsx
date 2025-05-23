
import React from 'react';
import { TradeInItem } from '../../../hooks/useTradeInList';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import WarningMessages from './WarningMessages';
import DebugPanel from './DebugPanel';
import CertifiedCardControls from './CertifiedCardControls';

interface ItemContentProps {
  item: TradeInItem;
  displayValue: number;
  isCalculating: boolean;
  error?: string;
  handleConditionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  updateQuantity: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleFirstEdition: () => void;
  toggleHolo: () => void;
  toggleReverseHolo: () => void;
  updatePaymentType: (type: 'cash' | 'trade') => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  refreshPrice: () => void;
  onValueAdjustment?: (value: number) => void;
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
}

const ItemContent: React.FC<ItemContentProps> = ({
  item,
  displayValue,
  isCalculating,
  error,
  handleConditionChange,
  updateQuantity,
  toggleFirstEdition,
  toggleHolo,
  toggleReverseHolo,
  updatePaymentType,
  handlePriceChange,
  refreshPrice,
  onValueAdjustment,
  isDebugMode,
  debugInfo
}) => {
  // Check if the card is certified (PSA card)
  const isCertified = item.card.isCertified;
  const certificationGrade = item.card.certification?.grade;

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
        />
      ) : (
        // Render normal controls for regular cards
        <ItemControls
          condition={item.condition}
          quantity={item.quantity}
          isFirstEdition={item.isFirstEdition}
          isHolo={item.isHolo}
          isReverseHolo={item.isReverseHolo || false}
          paymentType={item.paymentType}
          isLoadingPrice={item.isLoadingPrice}
          onConditionChange={handleConditionChange}
          onQuantityChange={updateQuantity}
          onToggleFirstEdition={toggleFirstEdition}
          onToggleHolo={toggleHolo}
          onToggleReverseHolo={toggleReverseHolo}
          onPaymentTypeChange={updatePaymentType}
        />
      )}

      <ItemValues
        price={item.price}
        paymentType={item.paymentType}
        displayValue={displayValue}
        isLoading={isCalculating}
        isLoadingPrice={item.isLoadingPrice}
        error={error || item.error}
        onPriceChange={handlePriceChange}
        onRefreshPrice={refreshPrice}
        isPriceUnavailable={item.isPriceUnavailable}
        onValueAdjustment={onValueAdjustment}
        usedFallback={item.usedFallback}
        fallbackReason={item.fallbackReason}
        isCertified={isCertified}
      />
      
      <WarningMessages 
        card={item.card}
        price={item.price}
      />
      
      <DebugPanel 
        isVisible={isDebugMode}
        debugInfo={debugInfo}
      />
    </>
  );
};

export default ItemContent;
