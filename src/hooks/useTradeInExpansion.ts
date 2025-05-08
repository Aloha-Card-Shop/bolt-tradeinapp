
import { useState } from 'react';

export const useTradeInExpansion = (fetchTradeInItems: (tradeInId: string) => Promise<void>) => {
  const [expandedTradeIn, setExpandedTradeIn] = useState<string | null>(null);

  const toggleTradeInDetails = async (tradeInId: string) => {
    if (expandedTradeIn === tradeInId) {
      // Collapse if already expanded
      setExpandedTradeIn(null);
    } else {
      // Expand and fetch items
      setExpandedTradeIn(tradeInId);
      await fetchTradeInItems(tradeInId);
    }
  };

  return {
    expandedTradeIn,
    toggleTradeInDetails
  };
};
