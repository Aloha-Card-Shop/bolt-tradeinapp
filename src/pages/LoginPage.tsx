
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto-redirect to app as authentication is not fully implemented yet
    navigate('/app');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Aloha Card Shop</h1>
          <p className="mt-2 text-gray-600">Trade-In System</p>
        </div>
        <p className="text-center text-sm text-gray-500">Redirecting to application...</p>
      </div>
    </div>
  );
};

export default LoginPage;
