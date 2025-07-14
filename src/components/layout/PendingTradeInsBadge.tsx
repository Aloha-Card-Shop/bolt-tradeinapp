import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle } from 'lucide-react';
import { usePendingTradeIns } from '../../hooks/usePendingTradeIns';

interface PendingTradeInsBadgeProps {
  userRole: string;
}

const PendingTradeInsBadge: React.FC<PendingTradeInsBadgeProps> = ({ userRole }) => {
  const { pendingCount, isLoading } = usePendingTradeIns();

  // Only show for managers and admins
  if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'shopify_manager') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to="/dashboard/manager"
      className="relative flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={`${pendingCount} pending trade-ins`}
    >
      {pendingCount > 0 ? (
        <>
          <Bell className="h-5 w-5 text-orange-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        </>
      ) : (
        <CheckCircle className="h-5 w-5 text-green-600" />
      )}
    </Link>
  );
};

export default PendingTradeInsBadge;