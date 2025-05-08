
import React from 'react';

const TradeInEmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 text-gray-500">
      No trade-ins found matching the current criteria
    </div>
  );
};

export default TradeInEmptyState;
