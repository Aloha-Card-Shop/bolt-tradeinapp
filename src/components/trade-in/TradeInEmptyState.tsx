
import React from 'react';

const TradeInEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in trade-in list</h3>
        <p className="text-gray-600">
          Search for cards using the search panel and add them to your trade-in list.
        </p>
      </div>
    </div>
  );
};

export default TradeInEmptyState;
