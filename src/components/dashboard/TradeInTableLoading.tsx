
import React from 'react';
import { Loader2 } from 'lucide-react';

const TradeInTableLoading: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
      <p className="mt-2">Loading trade-ins...</p>
    </div>
  );
};

export default TradeInTableLoading;
