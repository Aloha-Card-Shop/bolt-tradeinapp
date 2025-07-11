import { User, Session } from '@supabase/supabase-js';

export interface SessionUser extends User {
  user_metadata: {
    role: 'admin' | 'manager' | 'user' | 'shopify_manager';
    username?: string;
  };
}

export interface SessionHookReturn {
  session: Session | null;
  user: SessionUser | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  cleanupAuthState: () => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'manager' | 'user' | 'shopify_manager')[];
}