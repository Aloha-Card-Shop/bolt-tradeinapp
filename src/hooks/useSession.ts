
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { SessionHookReturn, SessionUser } from '../types/session';
import { AppError } from '../types/error';

// Helper function to clean up all Supabase auth state
const cleanupLocalStorage = () => {
  if (import.meta.env.DEV) {
    console.log("Cleaning up auth state from localStorage and sessionStorage");
  }
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      if (import.meta.env.DEV) {
        console.log(`Removing localStorage key: ${key}`);
      }
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      if (import.meta.env.DEV) {
        console.log(`Removing sessionStorage key: ${key}`);
      }
      sessionStorage.removeItem(key);
    }
  });
};

export const useSession = (): SessionHookReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    // Initial session check
    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (import.meta.env.DEV) {
        console.log("Auth state changed:", _event);
      }
      setSession(session);
      setUser(session?.user as SessionUser ?? null);
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
      setUser(session?.user as SessionUser ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get session'));
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log("SignOut process initiated");
      }
      toast.loading("Signing out...");
      
      // Clean up auth state first to ensure we don't have leftover tokens
      cleanupLocalStorage();
      
      // Attempt global sign out with Supabase
      await supabase.auth.signOut({ scope: 'global' });
      if (import.meta.env.DEV) {
        console.log("Supabase signOut completed");
      }
      
      // Clear state
      setSession(null);
      setUser(null);

      // Force page reload for a completely clean state
      if (import.meta.env.DEV) {
        console.log("Redirecting to login page with full page reload");
      }
      toast.dismiss();
      toast.success("Signed out successfully");
      
      // Small delay to ensure toast is visible
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error signing out:', error);
      }
      toast.dismiss();
      toast.error("Error signing out. Please try again.");
    }
  };

  return {
    session,
    user,
    loading,
    error,
    signOut,
    cleanupAuthState: cleanupLocalStorage
  };
};
