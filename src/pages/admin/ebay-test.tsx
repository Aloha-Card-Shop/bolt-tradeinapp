
import React from 'react';
import { useSession } from '../../hooks/useSession';
import EbayAccountDeletionTest from '../../components/admin/EbayAccountDeletionTest';
import { Navigate } from 'react-router-dom';

const EbayTestPage: React.FC = () => {
  const { user, loading } = useSession();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  const userRole = user?.user_metadata?.role || 'user';
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">eBay Integration Test</h1>
          <p className="text-gray-600 mt-2">
            Test the eBay account deletion notification endpoint compliance
          </p>
        </div>
        
        <EbayAccountDeletionTest />
      </div>
    </div>
  );
};

export default EbayTestPage;
