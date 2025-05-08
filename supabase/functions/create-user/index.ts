
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface CreateUserRequest {
  email?: string;
  password: string;
  username?: string;
  role: 'admin' | 'manager' | 'user';
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
    const { email, password, username, role }: CreateUserRequest = await req.json();

    // Validate input
    if ((!email && !username) || !password || !role) {
      throw new Error('Either email or username is required, and password and role are required');
    }

    if (!['admin', 'manager', 'user'].includes(role)) {
      throw new Error('Invalid role');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Generate email from username if email is not provided
    const actualEmail = email || `${username}@alohacardshop.com`;

    // Check if user already exists
    if (email) {
      const { data: existingUserByEmail } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (existingUserByEmail) {
        throw new Error('User with this email already exists');
      }
    }

    // Define user options
    const userOptions: any = {
      email: actualEmail,
      password,
      email_confirm: true,
      user_metadata: { role }
    };

    // Add username if provided
    if (username && username.trim() !== '') {
      userOptions.user_metadata.username = username.trim();
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(userOptions);

    if (createError) {
      throw createError;
    }

    return new Response(
      JSON.stringify({
        id: newUser.user.id,
        email: newUser.user.email,
        username: newUser.user.user_metadata.username,
        role: newUser.user.user_metadata.role
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create user'
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
