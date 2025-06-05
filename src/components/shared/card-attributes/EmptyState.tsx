
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
      </label>
      <div className="p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500">No variants available for this card</span>
      </div>
    </div>
  );
};

export default EmptyState;
