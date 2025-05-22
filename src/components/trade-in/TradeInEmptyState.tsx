
import { Package } from 'lucide-react';

const TradeInEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="rounded-full bg-blue-50 p-3 mb-4">
        <Package className="h-6 w-6 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No cards added</h3>
      <p className="text-gray-500 max-w-md mb-4">
        Search for cards and add them to your trade-in list
      </p>
    </div>
  );
};

export default TradeInEmptyState;
