
import React, { ReactNode } from 'react';
import { useSession } from '../hooks/useSession';
import { useLocation, Navigate } from 'react-router-dom';
import LoadingSpinner from './shared/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { loading, user } = useSession();
  const location = useLocation();
  
  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  // If at login page and user is authenticated, redirect to dashboard
  if (location.pathname === '/' && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not at login page and user is not authenticated, redirect to login
  if (location.pathname !== '/' && !user) {
    return <Navigate to="/" replace />;
  }
  
  // If roles are specified, check if user has the required role
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = user.user_metadata?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

export default AuthGuard;
