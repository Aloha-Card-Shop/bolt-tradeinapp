
import { useState } from 'react';
import { StatusFilter } from '../types/tradeIn';
import { useTradeInFetch } from './useTradeInFetch';
import { useTradeInItems } from './useTradeInItems';
import { useTradeInActions } from './useTradeInActions';
import { useTradeInExpansion } from './useTradeInExpansion';

export const useTradeInManager = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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

  // Filter trade-ins by search query
  const filteredTradeIns = searchQuery.trim() === '' 
    ? tradeIns 
    : tradeIns.filter(tradeIn => {
        const query = searchQuery.toLowerCase();
        return (
          // Search by customer name
          (tradeIn.customer_name && tradeIn.customer_name.toLowerCase().includes(query)) ||
          // Search by ID
          tradeIn.id.toLowerCase().includes(query) ||
          // Search by total value as string
          tradeIn.total_value.toString().includes(query) ||
          // Search by cash value as string
          tradeIn.cash_value.toString().includes(query) ||
          // Search by trade value as string
          tradeIn.trade_value.toString().includes(query) ||
          // Search by status
          tradeIn.status.toLowerCase().includes(query) ||
          // Search by payment type
          (tradeIn.payment_type && tradeIn.payment_type.toLowerCase().includes(query))
        );
      });

  // Combine error messages
  const errorMessage = fetchErrorMessage || itemsErrorMessage || actionsErrorMessage;

  return {
    tradeIns: filteredTradeIns,
    setTradeIns,
    isDataLoading,
    errorMessage,
    actionLoading,
    expandedTradeIn,
    loadingItems,
    statusFilter,
    searchQuery,
    setStatusFilter,
    setSearchQuery,
    toggleTradeInDetails,
    handleApproveTradeIn,
    handleDenyTradeIn,
    handleDeleteTradeIn
  };
};
