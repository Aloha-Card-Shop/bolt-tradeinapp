
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import LoadingSpinner from './shared/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles = [] }) => {
  const { session, loading } = useSession();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // For now, we're not fully implementing auth, so just render the children
  return <>{children}</>;
};

export default AuthGuard;
