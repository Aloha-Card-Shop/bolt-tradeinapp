
import { useState } from 'react';
import { StatusFilter } from '../types/tradeIn';
import { useTradeInFetch } from './useTradeInFetch';
import { useTradeInItems } from './useTradeInItems';
import { useTradeInActions } from './useTradeInActions';
import { useTradeInExpansion } from './useTradeInExpansion';

export const useTradeInManager = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const { 
    tradeIns, 
    setTradeIns, 
    isDataLoading, 
    errorMessage: fetchErrorMessage 
  } = useTradeInFetch(statusFilter);
  
  const { 
    loadingItems, 
    fetchTradeInItems, 
    itemsErrorMessage 
  } = useTradeInItems(setTradeIns);
  
  const {
    expandedTradeIn,
    toggleTradeInDetails
  } = useTradeInExpansion(fetchTradeInItems);
  
  const {
    actionLoading,
    actionsErrorMessage,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  } = useTradeInActions(setTradeIns);

  // Combine error messages
  const errorMessage = fetchErrorMessage || itemsErrorMessage || actionsErrorMessage;

  return {
    tradeIns,
    isDataLoading,
    errorMessage,
    actionLoading,
    expandedTradeIn,
    loadingItems,
    statusFilter,
    setStatusFilter,
    toggleTradeInDetails,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  };
};
