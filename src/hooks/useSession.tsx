
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session } from '../types/auth';

interface SessionContextType {
  user: any | null;  // Using 'any' for now for compatibility with existing code
  loading: boolean;
  error: Error | null;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: () => {}
});

export const useSession = () => useContext(SessionContext);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock session for development purposes
    const mockSession = {
      user: {
        id: '1',
        email: 'user@example.com',
        user_metadata: {
          role: 'admin'
        }
      }
    };

    setTimeout(() => {
      setSession(mockSession);
      setLoading(false);
    }, 500);
  }, []);

  const signOut = () => {
    setSession(null);
    // In a real app, you would call the auth service to sign out
    // For now, we'll just redirect to login
    window.location.href = '/';
  };

  return (
    <SessionContext.Provider value={{ 
      user: session?.user || null, 
      loading, 
      error,
      signOut
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
