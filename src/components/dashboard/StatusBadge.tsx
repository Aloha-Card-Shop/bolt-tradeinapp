
import React from 'react';
import { Clock, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 text-amber-500" />,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800'
        };
      case 'accepted':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: <HelpCircle className="h-4 w-4 text-gray-500" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const { icon, bgColor, textColor } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium text-xs ${bgColor} ${textColor}`}>
      {icon}
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
