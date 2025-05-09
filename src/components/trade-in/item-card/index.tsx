
import React, { useEffect } from 'react';
import { TradeInItem as TradeInItemType } from '../../../hooks/useTradeInList';
import { useTradeValue } from '../../../hooks/useTradeValue';
import CardHeader from './CardHeader';
import ItemControls from './ItemControls';
import ItemValues from './ItemValues';
import { fetchCardPrices } from '../../../utils/scraper';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

const TradeInItem: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate,
  onConditionChange,
  onValueChange
}) => {
  const { cashValue, tradeValue, isLoading } = useTradeValue(item.card.game, item.price);

  // When values change, notify the parent and update the item with calculated values
  useEffect(() => {
    if (!isLoading && item.price > 0) {
      // Store the calculated values in the item
      onUpdate(index, { 
        ...item, 
        cashValue: cashValue,
        tradeValue: tradeValue 
      });
      
      // Notify parent component about the value change
      onValueChange({ cashValue, tradeValue });
    }
  }, [cashValue, tradeValue, isLoading, item.price, index, item, onUpdate, onValueChange]);
  
  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const condition = e.target.value;
    onConditionChange(condition);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(1, parseInt(e.target.value) || 1);
    onUpdate(index, { ...item, quantity });
  };
  
  const handlePaymentTypeChange = (type: 'cash' | 'trade') => {
    onUpdate(index, { ...item, paymentType: type });
  };

  const handleToggleFirstEdition = async () => {
    const newIsFirstEdition = !item.isFirstEdition;
    onUpdate(index, { ...item, isFirstEdition: newIsFirstEdition, isLoadingPrice: true, error: undefined });
    
    // Re-fetch price when edition changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          newIsFirstEdition,
          item.isHolo,
          item.card.game,
          item.isReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isFirstEdition: newIsFirstEdition, 
          price: parseFloat(data.price), 
          isLoadingPrice: false 
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isFirstEdition: newIsFirstEdition,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { ...item, isFirstEdition: newIsFirstEdition, isLoadingPrice: false });
    }
  };

  const handleToggleHolo = async () => {
    // Toggle holo and ensure reverse holo is off when holo is on
    const newIsHolo = !item.isHolo;
    onUpdate(index, { 
      ...item, 
      isHolo: newIsHolo, 
      isReverseHolo: newIsHolo ? false : item.isReverseHolo,
      isLoadingPrice: true,
      error: undefined
    });
    
    // Re-fetch price when holo status changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          item.isFirstEdition,
          newIsHolo,
          item.card.game,
          newIsHolo ? false : item.isReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isHolo: newIsHolo, 
          isReverseHolo: newIsHolo ? false : item.isReverseHolo,
          price: parseFloat(data.price),
          isLoadingPrice: false
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isHolo: newIsHolo, 
          isReverseHolo: newIsHolo ? false : item.isReverseHolo,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { 
        ...item, 
        isHolo: newIsHolo, 
        isReverseHolo: newIsHolo ? false : item.isReverseHolo,
        isLoadingPrice: false 
      });
    }
  };

  const handleToggleReverseHolo = async () => {
    // Toggle reverse holo and ensure holo is off when reverse holo is on
    const newIsReverseHolo = !item.isReverseHolo;
    onUpdate(index, { 
      ...item, 
      isReverseHolo: newIsReverseHolo, 
      isHolo: newIsReverseHolo ? false : item.isHolo,
      isLoadingPrice: true,
      error: undefined
    });
    
    // Re-fetch price when reverse holo status changes
    if (item.card.productId && item.condition) {
      try {
        const data = await fetchCardPrices(
          item.card.productId,
          item.condition,
          item.isFirstEdition,
          newIsReverseHolo ? false : item.isHolo,
          item.card.game,
          newIsReverseHolo
        );
        onUpdate(index, { 
          ...item, 
          isReverseHolo: newIsReverseHolo, 
          isHolo: newIsReverseHolo ? false : item.isHolo,
          price: parseFloat(data.price),
          isLoadingPrice: false
        });
      } catch (e) {
        onUpdate(index, { 
          ...item, 
          isReverseHolo: newIsReverseHolo, 
          isHolo: newIsReverseHolo ? false : item.isHolo,
          isLoadingPrice: false, 
          error: (e as Error).message 
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdate(index, { 
        ...item, 
        isReverseHolo: newIsReverseHolo, 
        isHolo: newIsReverseHolo ? false : item.isHolo,
        isLoadingPrice: false 
      });
    }
  };

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onUpdate(index, { ...item, price: newPrice });
  };

  // New function to refresh price data
  const handleRefreshPrice = async () => {
    if (!item.card.productId || !item.condition) {
      return; // Can't refresh without product ID and condition
    }
    
    onUpdate(index, { ...item, isLoadingPrice: true, error: undefined });
    
    try {
      const data = await fetchCardPrices(
        item.card.productId,
        item.condition,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
      );
      
      onUpdate(index, { 
        ...item, 
        price: parseFloat(data.price), 
        isLoadingPrice: false 
      });
    } catch (e) {
      onUpdate(index, { 
        ...item, 
        isLoadingPrice: false, 
        error: (e as Error).message 
      });
    }
  };

  // Calculate the display value based on payment type and quantity
  const displayValue = item.paymentType === 'cash' 
    ? (item.cashValue !== undefined ? item.cashValue : cashValue) * item.quantity 
    : (item.tradeValue !== undefined ? item.tradeValue : tradeValue) * item.quantity;

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-100 transition-colors duration-200">
      <CardHeader 
        card={item.card} 
        index={index}
        onRemove={onRemove}
      />
      
      <ItemControls
        index={index}
        condition={item.condition}
        quantity={item.quantity}
        isFirstEdition={item.isFirstEdition}
        isHolo={item.isHolo}
        isReverseHolo={item.isReverseHolo || false}
        paymentType={item.paymentType}
        isLoadingPrice={item.isLoadingPrice}
        onConditionChange={handleConditionChange}
        onQuantityChange={handleQuantityChange}
        onToggleFirstEdition={handleToggleFirstEdition}
        onToggleHolo={handleToggleHolo}
        onToggleReverseHolo={handleToggleReverseHolo}
        onPaymentTypeChange={handlePaymentTypeChange}
      />

      <ItemValues
        price={item.price}
        paymentType={item.paymentType}
        displayValue={displayValue}
        isLoading={isLoading}
        isLoadingPrice={item.isLoadingPrice}
        error={item.error}
        onPriceChange={handlePriceChange}
        onRefreshPrice={handleRefreshPrice}
      />
    </div>
  );
};

export default TradeInItem;
