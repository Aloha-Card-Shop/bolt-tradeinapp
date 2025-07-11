
import React from 'react';
import { useSession } from '../hooks/useSession';
import { useLocation, Navigate } from 'react-router-dom';
import LoadingSpinner from './shared/LoadingSpinner';
import { AuthGuardProps } from '../types/session';

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { loading, user } = useSession();
  const location = useLocation();
  
  if (import.meta.env.DEV) {
    console.log('AuthGuard - Loading:', loading, 'User:', user, 'Location:', location.pathname);
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }
  
  // If at login page and user is authenticated, redirect to dashboard
  if ((location.pathname === '/login' || location.pathname === '/') && user) {
    if (import.meta.env.DEV) {
      console.log('Redirecting authenticated user from login to dashboard');
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not at login page and user is not authenticated, redirect to login
  if (location.pathname !== '/login' && location.pathname !== '/' && !user) {
    if (import.meta.env.DEV) {
      console.log('Redirecting unauthenticated user to login');
    }
    return <Navigate to="/login" replace />;
  }
  
  // If roles are specified, check if user has the required role
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = user.user_metadata?.role;
    if (import.meta.env.DEV) {
      console.log('Checking role access - User role:', userRole, 'Required roles:', allowedRoles);
    }
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      if (import.meta.env.DEV) {
        console.log('Access denied - insufficient role');
      }
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

export default AuthGuard;
