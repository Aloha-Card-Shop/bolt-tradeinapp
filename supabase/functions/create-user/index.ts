
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

// Username validation function
function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  // Check length
  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmedUsername.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters long' };
  }

  // Check format - only allow alphanumeric, dots, underscores, and hyphens
  const validUsernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' };
  }

  // Check that it doesn't start or end with special characters
  if (trimmedUsername.startsWith('.') || trimmedUsername.startsWith('_') || trimmedUsername.startsWith('-') ||
      trimmedUsername.endsWith('.') || trimmedUsername.endsWith('_') || trimmedUsername.endsWith('-')) {
    return { isValid: false, error: 'Username cannot start or end with special characters' };
  }

  // Check for consecutive special characters
  if (/[._-]{2,}/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username cannot contain consecutive special characters' };
  }

  return { isValid: true };
}

// Sanitize username for email generation
function sanitizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
    .replace(/[._-]+/g, (match) => match[0]) // Replace consecutive special chars with single
    .replace(/^[._-]+|[._-]+$/g, ''); // Remove leading/trailing special chars
}

// Email validation function
function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
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

    let actualEmail: string;

    // If email is provided, validate it
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || 'Invalid email format');
      }
      actualEmail = email.trim();
    } else if (username) {
      // If only username is provided, validate and generate email
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.error || 'Invalid username format');
      }
      
      const sanitizedUsername = sanitizeUsername(username);
      if (!sanitizedUsername) {
        throw new Error('Username cannot be sanitized to create a valid email');
      }
      
      actualEmail = `${sanitizedUsername}@alohacardshop.com`;
      
      // Double-check the generated email is valid
      const generatedEmailValidation = validateEmail(actualEmail);
      if (!generatedEmailValidation.isValid) {
        throw new Error('Generated email from username is invalid. Please provide a valid email or username.');
      }
    } else {
      throw new Error('Either email or username is required');
    }

    // Check if user already exists by email
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === actualEmail);
    
    if (userExists) {
      throw new Error('User with this email already exists');
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

    console.log(`Creating user with email: ${actualEmail}, role: ${role}, username: ${username || 'none'}`);

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(userOptions);

    if (createError) {
      console.error('Supabase Auth error:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`Successfully created user: ${newUser.user.id}`);

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

    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';

    return new Response(
      JSON.stringify({
        error: errorMessage
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
