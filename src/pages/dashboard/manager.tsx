
import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ErrorDisplay from '../../components/dashboard/ErrorDisplay';
import TradeInStatusFilter from '../../components/dashboard/TradeInStatusFilter';
import TradeInTable from '../../components/dashboard/TradeInTable';
import SearchBar from '../../components/dashboard/SearchBar';
import { useTradeInManager } from '../../hooks/useTradeInManager';
import TradeInCardList from '../../components/dashboard/TradeInCardList';

const ManagerDashboard: React.FC = () => {
  const {
    tradeIns,
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
  } = useTradeInManager();
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Manager Dashboard</h1>

      <ErrorDisplay message={errorMessage} />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        {/* Search Bar */}
        <SearchBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          placeholder="Search by customer, ID, value, status..."
          className="w-full md:w-auto"
        />
        
        {/* Status Filter */}
        <TradeInStatusFilter 
          statusFilter={statusFilter} 
          setStatusFilter={setStatusFilter} 
        />
      </div>

      {/* Responsive Trade-in View - Table for desktop, Cards for mobile */}
      {isMobile ? (
        <TradeInCardList
          tradeIns={tradeIns}
          isLoading={isDataLoading}
          expandedTradeIn={expandedTradeIn}
          loadingItems={loadingItems}
          actionLoading={actionLoading}
          onToggleDetails={toggleTradeInDetails}
          onApprove={handleApproveTradeIn}
          onDeny={handleDenyTradeIn}
          onDelete={handleDeleteTradeIn}
          setTradeIns={setTradeIns}
        />
      ) : (
        <TradeInTable 
          tradeIns={tradeIns}
          isLoading={isDataLoading}
          expandedTradeIn={expandedTradeIn}
          loadingItems={loadingItems}
          actionLoading={actionLoading}
          onToggleDetails={toggleTradeInDetails}
          onApprove={handleApproveTradeIn}
          onDeny={handleDenyTradeIn}
          onDelete={handleDeleteTradeIn}
          setTradeIns={setTradeIns}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
