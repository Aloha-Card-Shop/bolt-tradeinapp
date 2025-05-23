
import { useState } from 'react';
import { Customer } from './useCustomers';
import { TradeInItem } from './useTradeInList';
import { useTradeInSubmission } from './useTradeInSubmission';
import { toast } from 'react-hot-toast';

interface UseTradeInReviewProps {
  items: TradeInItem[];
  clearList: () => void;
}

export const useTradeInReview = ({ items, clearList }: UseTradeInReviewProps) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [itemValuesMap, setItemValuesMap] = useState<Record<string, { tradeValue: number; cashValue: number }>>({});
  
  const { 
    isSubmitting, 
    error, 
    validItems, 
    totalCashValue,
    totalTradeValue,
    handleSubmit
  } = useTradeInSubmission({
    items,
    selectedCustomer,
    itemValuesMap,
    clearList,
    onSuccess: () => {
      setIsReviewing(false);
      setSelectedCustomer(null);
      toast.success('Trade-in submitted successfully!');
    }
  });

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleValueChange = (itemId: string, values: { tradeValue: number; cashValue: number }) => {
    if (!itemId) return;
    
    setItemValuesMap(prev => {
      const currentValues = prev[itemId];
      if (currentValues && 
          currentValues.tradeValue === values.tradeValue && 
          currentValues.cashValue === values.cashValue) {
        return prev;
      }
      
      return { ...prev, [itemId]: values };
    });
  };

  const startReview = () => setIsReviewing(true);
  const cancelReview = () => setIsReviewing(false);

  return {
    isReviewing,
    selectedCustomer,
    itemValuesMap,
    isSubmitting,
    error,
    validItems,
    totalCashValue,
    totalTradeValue,
    startReview,
    cancelReview,
    handleCustomerSelect,
    handleValueChange,
    handleSubmit
  };
};
