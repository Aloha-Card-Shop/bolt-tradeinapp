
import { supabase } from './supabase';

// Safely access supabaseUrl for use in admin pages
export const getSupabaseUrl = (): string => {
  // Using a hardcoded URL value instead of accessing the protected property
  return 'https://qgsabaicokoynabxgdco.supabase.co';
};

// Helper function to get auth token from session
export const getAuthToken = async (): Promise<string | null> => {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token || null;
};
