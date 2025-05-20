
import React, { ReactNode } from 'react';
import { useSession } from '../hooks/useSession';
import LoadingSpinner from './shared/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { loading } = useSession();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // For now, we're not fully implementing auth, so just render the children
  return <>{children}</>;
};

export default AuthGuard;
