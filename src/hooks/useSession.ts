import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SessionHookReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const useSession = (): SessionHookReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial session check
    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      setSession(session);
      setUser(session?.user ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get session'));
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    loading,
    error
  };
};