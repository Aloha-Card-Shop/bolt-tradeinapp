
import React from 'react';
import { Filter } from 'lucide-react';

interface TradeInStatusFilterProps {
  statusFilter: 'all' | 'pending' | 'completed' | 'cancelled';
  setStatusFilter: (status: 'all' | 'pending' | 'completed' | 'cancelled') => void;
}

const TradeInStatusFilter: React.FC<TradeInStatusFilterProps> = ({ 
  statusFilter, 
  setStatusFilter 
}) => {
  return (
    <div className="mb-6 flex items-center">
      <Filter className="h-5 w-5 text-gray-500 mr-2" />
      <span className="mr-3 text-sm font-medium text-gray-700">Filter status:</span>
      <div className="flex space-x-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Cancelled
        </button>
      </div>
    </div>
  );
};

export default TradeInStatusFilter;
