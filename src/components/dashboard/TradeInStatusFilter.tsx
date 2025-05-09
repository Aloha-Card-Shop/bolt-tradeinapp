
import React from 'react';
import { Filter } from 'lucide-react';
import { StatusFilter } from '../../types/tradeIn';

interface TradeInStatusFilterProps {
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
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
          onClick={() => setStatusFilter('accepted')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Accepted
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1 text-sm rounded-full ${
            statusFilter === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Rejected
        </button>
      </div>
    </div>
  );
};

export default TradeInStatusFilter;
