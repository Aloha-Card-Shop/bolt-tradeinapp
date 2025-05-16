
import React from 'react';
import AuthGuard from '../../components/AuthGuard';
import ShopifyTester from '../../components/shopify/ShopifyTester';

const ShopifyTestPage: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'shopify_manager']}>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Shopify Integration Test</h1>
        <ShopifyTester />
      </div>
    </AuthGuard>
  );
};

export default ShopifyTestPage;
