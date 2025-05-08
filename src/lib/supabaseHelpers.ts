
import { supabase } from './supabase';

// Safely access supabaseUrl for use in admin pages
export const getSupabaseUrl = (): string => {
  // Using any to bypass TypeScript protection since supabaseUrl is needed
  // but is protected in the SupabaseClient class
  return (supabase as any).supabaseUrl || '';
};

// Helper function to get auth token from session
export const getAuthToken = async (): Promise<string | null> => {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token || null;
};
