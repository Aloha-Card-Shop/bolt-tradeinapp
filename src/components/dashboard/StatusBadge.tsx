
import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <span className="relative inline-block px-3 py-1 font-semibold text-gray-900 leading-tight">
      <span aria-hidden className="absolute inset-0 bg-gray-200 opacity-50 rounded-full"></span>
      <span className="relative flex items-center space-x-1">
        {getStatusIcon(status)}
        <span>{status}</span>
      </span>
    </span>
  );
};

export default StatusBadge;
