
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing Supabase environment variables';
  console.error(errorMessage);
  toast.error(errorMessage);
  throw new Error(errorMessage);
}

// Log connection details in development only
if (import.meta.env.DEV) {
  console.log('🔌 Connecting to Supabase:', { 
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    keyPrefix: supabaseAnonKey.substring(0, 10) + '...'
  });
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'trade-in-app'
      }
    }
  }
);

// Add a health check function for debugging
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection verified');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    toast.error('Database connection failed. Please refresh or try again later.');
    return false;
  }
};
