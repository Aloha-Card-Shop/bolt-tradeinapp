
// Authentication utility for Shopify-related edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { decode } from "https://deno.land/x/djwt@v2.8/mod.ts";

interface AuthResult {
  userId: string;
  role: string;
  error?: string;
}

// Authenticate admin/manager for Shopify operations
export const authenticateAdmin = async (req: Request): Promise<AuthResult> => {
  try {
    // Extract authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return { userId: '', role: '', error: 'Missing authorization header' };
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    
    // Create client for authentication check
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return { userId: '', role: '', error: authError?.message || 'Invalid session' };
    }

    // Check if user has the required role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return { userId: user.id, role: '', error: 'Failed to fetch user profile' };
    }
    
    const userRole = profile?.role || '';
    
    // Check if role is sufficient for Shopify operations
    if (!['admin', 'manager', 'shopify_manager'].includes(userRole)) {
      return { userId: user.id, role: userRole, error: 'Insufficient permissions' };
    }
    
    // Return successful authentication
    return { userId: user.id, role: userRole, error: undefined };
  } catch (error) {
    console.error('Authentication error:', error);
    return { userId: '', role: '', error: `Authentication failed: ${error.message || 'Unknown error'}` };
  }
};

// Create a response with CORS headers
export const createResponse = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }
  });
};

// Create Supabase clients - both regular and admin with service role
export const createClients = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  
  // Regular client for auth checks
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Admin client with service role for bypassing RLS
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  
  return { supabase, adminSupabase };
};

// Handle CORS preflight requests
export const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
    });
  }
  return null;
};
