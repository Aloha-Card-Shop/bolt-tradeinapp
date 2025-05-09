
import React from 'react';
import { TradeInItem } from '../../../hooks/useTradeInList';
import CardCondition from './CardCondition';
import CardQuantity from './CardQuantity';
import ItemTypeToggle from '../ItemTypeToggle';
import PaymentTypeSelect from './PaymentTypeSelect';
import PriceInput from './PriceInput';
import ValueDisplay from './ValueDisplay';
import { fetchCardPrices } from '../../../utils/scraper';
import { toast } from 'react-hot-toast';

interface ItemAttributesSectionProps {
  item: TradeInItem;
  index: number;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  itemValue?: { tradeValue: number; cashValue: number; };
}

const ItemAttributesSection: React.FC<ItemAttributesSectionProps> = ({ 
  item, 
  index, 
  onUpdateItem,
  itemValue 
}) => {
  const currentValue = item.paymentType === 'cash' ? itemValue?.cashValue : itemValue?.tradeValue;
  
  // Handle condition change
  const handleConditionChange = (condition: string) => {
    onUpdateItem(index, { ...item, condition: condition as any });
  };

  // Handle quantity change
  const handleQuantityChange = (quantity: number) => {
    onUpdateItem(index, { ...item, quantity });
  };

  // Handle payment type change
  const handlePaymentTypeChange = (paymentType: 'cash' | 'trade') => {
    onUpdateItem(index, { ...item, paymentType });
  };

  // Handle price change
  const handlePriceChange = (price: number) => {
    onUpdateItem(index, { ...item, price, isPriceUnavailable: false });
  };

  // Handle first edition toggle with price refetch
  const handleToggleFirstEdition = async () => {
    const newIsFirstEdition = !item.isFirstEdition;
    onUpdateItem(index, { ...item, isFirstEdition: newIsFirstEdition, isLoadingPrice: true, error: undefined, isPriceUnavailable: false });
    
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
        
        if (data.unavailable) {
          onUpdateItem(index, { 
            ...item, 
            isFirstEdition: newIsFirstEdition, 
            price: 0, 
            isLoadingPrice: false,
            isPriceUnavailable: true
          });
          toast.error("No price available for this card configuration");
        } else {
          onUpdateItem(index, { 
            ...item, 
            isFirstEdition: newIsFirstEdition, 
            price: parseFloat(data.price), 
            isLoadingPrice: false,
            isPriceUnavailable: false
          });
        }
      } catch (e) {
        onUpdateItem(index, { 
          ...item, 
          isFirstEdition: newIsFirstEdition,
          isLoadingPrice: false, 
          error: (e as Error).message,
          isPriceUnavailable: false
        });
      }
    } else {
      // If no product ID or condition, just toggle without fetching
      onUpdateItem(index, { 
        ...item, 
        isFirstEdition: newIsFirstEdition, 
        isLoadingPrice: false 
      });
    }
  };

  // Handle holo toggle with price refetch
  const handleToggleHolo = async () => {
    const newIsHolo = !item.isHolo;
    onUpdateItem(index, { 
      ...item, 
      isHolo: newIsHolo, 
      isReverseHolo: newIsHolo ? false : item.isReverseHolo,
      isLoadingPrice: true,
      error: undefined,
      isPriceUnavailable: false
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
        
        if (data.unavailable) {
          onUpdateItem(index, { 
            ...item, 
            isHolo: newIsHolo, 
            isReverseHolo: newIsHolo ? false : item.isReverseHolo,
            price: 0,
            isLoadingPrice: false,
            isPriceUnavailable: true
          });
          toast.error("No price available for this card configuration");
        } else {
          onUpdateItem(index, { 
            ...item, 
            isHolo: newIsHolo, 
            isReverseHolo: newIsHolo ? false : item.isReverseHolo,
            price: parseFloat(data.price),
            isLoadingPrice: false,
            isPriceUnavailable: false
          });
        }
      } catch (e) {
        onUpdateItem(index, { 
          ...item, 
          isHolo: newIsHolo, 
          isReverseHolo: newIsHolo ? false : item.isReverseHolo,
          isLoadingPrice: false, 
          error: (e as Error).message,
          isPriceUnavailable: false
        });
      }
    } else {
      onUpdateItem(index, { 
        ...item, 
        isHolo: newIsHolo, 
        isReverseHolo: newIsHolo ? false : item.isReverseHolo,
        isLoadingPrice: false 
      });
    }
  };

  // Handle reverse holo toggle with price refetch
  const handleToggleReverseHolo = async () => {
    const newIsReverseHolo = !item.isReverseHolo;
    onUpdateItem(index, { 
      ...item, 
      isReverseHolo: newIsReverseHolo, 
      isHolo: newIsReverseHolo ? false : item.isHolo,
      isLoadingPrice: true,
      error: undefined,
      isPriceUnavailable: false
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
        
        if (data.unavailable) {
          onUpdateItem(index, { 
            ...item, 
            isReverseHolo: newIsReverseHolo, 
            isHolo: newIsReverseHolo ? false : item.isHolo,
            price: 0,
            isLoadingPrice: false,
            isPriceUnavailable: true
          });
          toast.error("No price available for this card configuration");
        } else {
          onUpdateItem(index, { 
            ...item, 
            isReverseHolo: newIsReverseHolo, 
            isHolo: newIsReverseHolo ? false : item.isHolo,
            price: parseFloat(data.price),
            isLoadingPrice: false,
            isPriceUnavailable: false
          });
        }
      } catch (e) {
        onUpdateItem(index, { 
          ...item, 
          isReverseHolo: newIsReverseHolo, 
          isHolo: newIsReverseHolo ? false : item.isHolo,
          isLoadingPrice: false, 
          error: (e as Error).message,
          isPriceUnavailable: false
        });
      }
    } else {
      onUpdateItem(index, { 
        ...item, 
        isReverseHolo: newIsReverseHolo, 
        isHolo: newIsReverseHolo ? false : item.isHolo,
        isLoadingPrice: false 
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <CardCondition 
        condition={item.condition}
        onChange={handleConditionChange}
      />

      <CardQuantity 
        quantity={item.quantity} 
        onChange={handleQuantityChange}
      />

      <ItemTypeToggle
        isFirstEdition={item.isFirstEdition}
        isHolo={item.isHolo}
        isReverseHolo={item.isReverseHolo || false}
        onToggleFirstEdition={handleToggleFirstEdition}
        onToggleHolo={handleToggleHolo}
        onToggleReverseHolo={handleToggleReverseHolo}
        isLoading={item.isLoadingPrice}
      />

      <PaymentTypeSelect
        paymentType={item.paymentType}
        onChange={handlePaymentTypeChange}
      />

      <PriceInput
        price={item.price}
        onChange={handlePriceChange}
        error={item.error}
        isPriceUnavailable={item.isPriceUnavailable}
      />

      <ValueDisplay
        value={currentValue}
        quantity={item.quantity}
      />
    </div>
  );
};

export default ItemAttributesSection;
