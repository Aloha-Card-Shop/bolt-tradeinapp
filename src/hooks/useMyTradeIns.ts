
import { useEffect, useState } from 'react';
import { useTradeInExpansion } from './useTradeInExpansion';
import { useTradeInFetch } from './useTradeInFetch';

export const useMyTradeIns = () => {
  // Reuse the existing fetch logic (loads from Supabase, sorted by date)
  const { tradeIns, setTradeIns, isDataLoading, errorMessage } = useTradeInFetch('all');

  const [loadingItems, setLoadingItems] = useState<string | null>(null);

  // Optional: prefetch items when expanding
  const fetchTradeInItems = async (tradeInId: string) => {
    setLoadingItems(tradeInId);
    // Placeholder: if needed, implement item fetch here
    await new Promise((r) => setTimeout(r, 300));
    setLoadingItems(null);
  };

  const { expandedTradeIn, toggleTradeInDetails } = useTradeInExpansion(fetchTradeInItems);

  useEffect(() => {
    // no-op, kept for API compatibility
  }, []);

  return {
    tradeIns,
    setTradeIns,
    isLoading: isDataLoading,
    errorMessage,
    expandedTradeIn,
    loadingItems,
    handleToggleDetails: toggleTradeInDetails,
  };
};
