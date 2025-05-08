
import React from 'react';
import ErrorDisplay from '../../components/dashboard/ErrorDisplay';
import TradeInStatusFilter from '../../components/dashboard/TradeInStatusFilter';
import TradeInTable from '../../components/dashboard/TradeInTable';
import { useTradeInManager } from '../../hooks/useTradeInManager';

const ManagerDashboard: React.FC = () => {
  const {
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
  } = useTradeInManager();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Manager Dashboard</h1>

      <ErrorDisplay message={errorMessage} />

      {/* Status Filter */}
      <TradeInStatusFilter 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />

      {/* Trade-in Table */}
      <TradeInTable 
        tradeIns={tradeIns}
        isLoading={isDataLoading}
        expandedTradeIn={expandedTradeIn}
        loadingItems={loadingItems}
        actionLoading={actionLoading}
        statusFilter={statusFilter}
        onToggleDetails={toggleTradeInDetails}
        onApprove={handleApproveTradeIn}
        onDeny={handleDenyTradeIn}
        onDelete={handleDeleteTradeIn}
      />
    </div>
  );
};

export default ManagerDashboard;
