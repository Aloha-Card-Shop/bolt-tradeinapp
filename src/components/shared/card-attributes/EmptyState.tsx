
import React from 'react';
import { Package, Info } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Card Type
      </label>
      <div className="card-base p-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-muted rounded-full">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">No variants available</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              This card doesn't have multiple variants. The standard version will be used.
            </p>
          </div>
          <div className="flex items-center text-xs text-info bg-info-light px-3 py-1 rounded-full">
            <Info className="h-3 w-3 mr-1" />
            Using default card type
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
