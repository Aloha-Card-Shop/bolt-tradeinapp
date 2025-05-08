import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get request body
    const { userId }: DeleteUserRequest = await req.json();

    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if user exists and get their role
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError) {
      throw getUserError;
    }

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prevent deletion of the last admin user
    if (existingUser.user.user_metadata.role === 'admin') {
      // Count remaining admin users
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }

      const adminCount = users.users.filter(u => u.user_metadata.role === 'admin').length;
      
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete user'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});