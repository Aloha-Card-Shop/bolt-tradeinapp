
import React from 'react';
import AuthGuard from '../../components/AuthGuard';
import ShopifySettingsForm from '../../components/shopify/ShopifySettingsForm';

const ShopifySettingsPage: React.FC = () => {
  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'shopify_manager']}>
      <div className="container mx-auto p-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Shopify Integration Settings</h1>
        <ShopifySettingsForm />
      </div>
    </AuthGuard>
  );
};

export default ShopifySettingsPage;
