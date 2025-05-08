
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'manager' | 'user')[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useSession();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }

      const userRole = user.user_metadata?.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        toast.error('You do not have permission to access this page');
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.user_metadata?.role || 'user')) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
