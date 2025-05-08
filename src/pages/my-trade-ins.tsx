
import React from 'react';
import { useSession } from '../hooks/useSession';
import { useMyTradeIns } from '../hooks/useMyTradeIns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MyTradeInsContent from '../components/trade-in/MyTradeInsContent';

const MyTradeIns: React.FC = () => {
  const { loading } = useSession();
  const {
    tradeIns,
    isLoading,
    errorMessage,
    expandedTradeIn,
    loadingItems,
    handleToggleDetails
  } = useMyTradeIns();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <MyTradeInsContent
      tradeIns={tradeIns}
      isLoading={isLoading}
      errorMessage={errorMessage}
      expandedTradeIn={expandedTradeIn}
      loadingItems={loadingItems}
      onToggleDetails={handleToggleDetails}
    />
  );
};

export default MyTradeIns;
