
import { useSession } from './useSession';

export const useUserRole = () => {
  const { user } = useSession();
  
  // Extract role from user metadata or JWT claims
  const role = (user as any)?.user_metadata?.role || 
               (user as any)?.role || 
               'user';
  
  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || isAdmin;
  const isUser = role === 'user';
  
  return {
    role,
    isAdmin,
    isManager,
    isUser,
    canAdjustValues: isAdmin || isManager,
    canManageUsers: isAdmin,
    canViewDashboard: isAdmin || isManager
  };
};
