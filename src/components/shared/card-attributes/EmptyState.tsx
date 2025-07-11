
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Card Type
      </label>
      <div className="text-sm text-muted-foreground px-3 py-2">
        N/A
      </div>
    </div>
  );
};

export default EmptyState;
