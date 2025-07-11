
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import { toast } from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, cleanupAuthState } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (import.meta.env.DEV) {
        console.log("User already logged in, redirecting to dashboard");
      }
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log("Login process initiated");
      }
      
      // Clean up existing auth state to prevent conflicts
      cleanupAuthState();
      
      // Attempt global sign out first (in case there's any existing session)
      try {
        if (import.meta.env.DEV) {
          console.log("Attempting global sign out before login");
        }
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Pre-login signout failed (this is usually fine):", err);
        }
        // Continue even if this fails
      }

      // Determine if identifier is an email
      const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
      let result;
      
      if (isEmail) {
        // Login with email and password
        if (import.meta.env.DEV) {
          console.log("Attempting login with email");
        }
        result = await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });
      } else {
        // Login with username
        if (import.meta.env.DEV) {
          console.log("Attempting login with username:", identifier);
        }
        // First get email associated with this username from profiles table
        const { data: userData, error: fetchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .maybeSingle();
        
        if (fetchError) {
          if (import.meta.env.DEV) {
            console.error('Username lookup error:', fetchError);
          }
          throw new Error('Error looking up username');
        }
        
        if (!userData || !userData.email) {
          if (import.meta.env.DEV) {
            console.error('Username not found:', identifier);
          }
          throw new Error('Invalid username or password');
        }
        
        if (import.meta.env.DEV) {
          console.log('Found email for username:', userData.email);
        }
        
        // Now login with the retrieved email
        result = await supabase.auth.signInWithPassword({
          email: userData.email,
          password
        });
      }

      if (result.error) {
        if (import.meta.env.DEV) {
          console.error('Auth error:', result.error);
        }
        throw result.error;
      }

      if (result.data?.session) {
        if (import.meta.env.DEV) {
          console.log("Login successful, redirecting to dashboard");
        }
        toast.success('Logged in successfully');
        // Force page reload to ensure clean state
        window.location.href = '/dashboard';
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
            <p className="text-gray-600 mt-2">Sign in to access the dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <div className="relative">
                {/^\S+@\S+\.\S+$/.test(identifier) ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                )}
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email or username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
