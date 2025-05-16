
import React from 'react';
import AuthGuard from '../../components/AuthGuard';
import ShopifySyncLogs from '../../components/shopify/ShopifySyncLogs';

const ShopifyLogsPage: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'shopify_manager']}>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Shopify Sync Logs</h1>
        <ShopifySyncLogs limit={100} />
      </div>
    </AuthGuard>
  );
};

export default ShopifyLogsPage;
