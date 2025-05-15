
import React from 'react';
import AuthGuard from '../../components/AuthGuard';
import ShopifyMappingsEditor from '../../components/shopify/ShopifyMappingsEditor';

const ShopifyMappingsPage: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['admin', 'shopify_manager']}>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Shopify Field Mappings</h1>
        <ShopifyMappingsEditor />
      </div>
    </AuthGuard>
  );
};

export default ShopifyMappingsPage;
