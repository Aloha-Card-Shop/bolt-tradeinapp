
import { useState, useEffect } from 'react';
import { TradeIn } from '../types/tradeIn';
import { useTradeInExpansion } from './useTradeInExpansion';

export const useMyTradeIns = () => {
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  // For demo purposes, we're mocking this functionality
  const fetchTradeInItems = async (tradeInId: string) => {
    setLoadingItems(tradeInId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingItems(null);
  };

  const { expandedTradeIn, toggleTradeInDetails } = useTradeInExpansion(fetchTradeInItems);

  useEffect(() => {
    const fetchTradeIns = async () => {
      try {
        setIsLoading(true);
        // Mock data for demonstration
        const mockTradeIns: TradeIn[] = [
          {
            id: '1',
            customer_id: '101',
            trade_in_date: new Date().toISOString(),
            total_value: 125.50,
            status: 'pending',
            cash_value: 100.40,
            trade_value: 125.50,
            customers: {
              first_name: 'John',
              last_name: 'Doe'
            }
          },
          {
            id: '2',
            customer_id: '102',
            trade_in_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            total_value: 78.25,
            status: 'accepted', // Changed from "approved" to "accepted"
            cash_value: 60.20,
            trade_value: 78.25,
            customers: {
              first_name: 'Jane',
              last_name: 'Smith'
            }
          }
        ];
        
        setTradeIns(mockTradeIns);
      } catch (error) {
        console.error('Error fetching trade-ins:', error);
        setErrorMessage('Failed to load trade-ins. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeIns();
  }, []);

  return {
    tradeIns,
    isLoading,
    errorMessage,
    expandedTradeIn,
    loadingItems,
    handleToggleDetails: toggleTradeInDetails
  };
};
